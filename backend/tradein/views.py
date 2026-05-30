from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import TradeInRequest, TradeInTempImage, TradeInPriceConfig
from .serializers import (
    TradeInEstimateSerializer,
    TradeInCreateSerializer,
    TradeInDetailSerializer,
    StaffApproveSerializer,
    StaffRejectSerializer,
    TempImageUploadSerializer,
)
from .services.tradeinService import TradeInService
from .services.pricingService import PricingService
from products.models import Category, Brand
from products.serializers import CategorySerializer, BrandSerializer


class TradeInViewSet(viewsets.ModelViewSet):

    http_method_names = ["get", "post", "delete", "head", "options"]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]

    def get_permissions(self):
        staff_actions = ["approve", "reject"]
        if self.action in staff_actions:
            return [permissions.IsAdminUser()]
            
        allow_any_actions = ["estimate", "upload_temp", "delete_temp"]
        if self.action in allow_any_actions:
            return [permissions.AllowAny()]
            
        return [permissions.IsAuthenticated()]


    def get_serializer_class(self):
        mapping = {
            "estimate":    TradeInEstimateSerializer,
            "create":      TradeInCreateSerializer,
            "approve":     StaffApproveSerializer,
            "reject":      StaffRejectSerializer,
            "upload_temp": TempImageUploadSerializer,
        }
        return mapping.get(self.action, TradeInDetailSerializer)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return TradeInRequest.objects.all()
        return TradeInRequest.objects.filter(user=user)

    # POST /tradein/ — User tạo TradeInRequest
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_key = str(serializer.validated_data.pop("session_key"))
        tradein = TradeInService.create_tradein(
            user=request.user,
            validated_data=serializer.validated_data,
            session_key=session_key,
        )
        return Response(TradeInDetailSerializer(tradein).data, status=status.HTTP_201_CREATED)

    # POST /tradein/estimate/ — User xem giá ước tính
    @action(detail=False, methods=["post"], url_path="estimate")
    def estimate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = PricingService.estimate_price(serializer.validated_data)
        return Response(result)

    # POST /tradein/upload_temp/ — User upload ảnh tạm
    @action(detail=False, methods=["post"], url_path="upload_temp")
    def upload_temp(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        temp_image = TradeInTempImage.objects.create(
            session_key=serializer.validated_data["session_key"],
            image=serializer.validated_data["image"],
        )
        return Response(
            {
                "id": temp_image.id,
                "session_key": str(temp_image.session_key),
                "image_url": temp_image.image.url,
            },
            status=status.HTTP_201_CREATED,
        )

    # DELETE /tradein/delete_temp/{id}/ — User xoá ảnh tạm
    @action(detail=False, methods=["delete"], url_path=r"delete_temp/(?P<temp_id>\d+)")
    def delete_temp(self, request, temp_id=None):
        try:
            temp_image = TradeInTempImage.objects.get(id=temp_id, is_used=False)
        except TradeInTempImage.DoesNotExist:
            return Response({"detail": "Ảnh tạm không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        temp_image.image.delete(save=False)
        temp_image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # POST /tradein/{id}/cancel/ — User tự huỷ
    # Sau này thêm lý do hủy, reject_reason
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        tradein = self.get_object()
        if tradein.user != request.user and not request.user.is_staff:
            raise PermissionDenied("Bạn không có quyền huỷ yêu cầu này.")
        tradein = TradeInService.cancel_tradein(tradein)
        return Response(TradeInDetailSerializer(tradein).data)

    # POST /tradein/{id}/approve/ — Staff duyệt
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        tradein = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tradein = TradeInService.approve_tradein(
            tradein=tradein,
            staff_note=serializer.validated_data.get("staff_note", ""),
        )
        return Response(TradeInDetailSerializer(tradein).data)

    # POST /tradein/{id}/reject/ — Staff từ chối
    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        tradein = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tradein = TradeInService.reject_tradein(
            tradein=tradein,
            reject_reason=serializer.validated_data["reject_reason"],
        )
        return Response(TradeInDetailSerializer(tradein).data)


class TradeInOptionsViewSet(viewsets.ViewSet):
    """
    ViewSet phục vụ việc lấy thông số cấu hình Dropdowns cho Trade-in.
    Cho phép khách vãng lai gọi không cần đăng nhập.
    """
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        # Lấy tất cả category_id đang có cấu hình trong TradeInPriceConfig
        active_cat_ids = TradeInPriceConfig.objects.values_list("category_id", flat=True).distinct()
        categories = Category.objects.filter(id__in=active_cat_ids)
        serializer = CategorySerializer(categories, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="brands")
    def brands(self, request):
        category_id = request.query_params.get("category_id")
        if not category_id:
            return Response({"detail": "Thiếu category_id parameter."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Lấy tất cả brand_id đang có cấu hình cho category này
        active_brand_ids = TradeInPriceConfig.objects.filter(
            category_id=category_id
        ).values_list("brand_id", flat=True).distinct()
        
        brands = Brand.objects.filter(id__in=active_brand_ids)
        serializer = BrandSerializer(brands, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="models")
    def models(self, request):
        category_id = request.query_params.get("category_id")
        brand_id = request.query_params.get("brand_id")
        if not category_id or not brand_id:
            return Response({"detail": "Thiếu category_id hoặc brand_id parameter."}, status=status.HTTP_400_BAD_REQUEST)

        # Lấy danh sách tên model độc bản
        models_list = TradeInPriceConfig.objects.filter(
            category_id=category_id,
            brand_id=brand_id
        ).values_list("model_name", flat=True).distinct()
        
        return Response(list(models_list))

    @action(detail=False, methods=["get"], url_path="storages")
    def storages(self, request):
        category_id = request.query_params.get("category_id")
        brand_id = request.query_params.get("brand_id")
        model_name = request.query_params.get("model_name")
        if not all([category_id, brand_id, model_name]):
            return Response({"detail": "Thiếu các tham số bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)

        # Lấy danh sách dung lượng độc bản
        storages_list = TradeInPriceConfig.objects.filter(
            category_id=category_id,
            brand_id=brand_id,
            model_name=model_name
        ).values_list("storage", flat=True).distinct()
        
        return Response(list(storages_list))

    @action(detail=False, methods=["get"], url_path="rams")
    def rams(self, request):
        category_id = request.query_params.get("category_id")
        brand_id = request.query_params.get("brand_id")
        model_name = request.query_params.get("model_name")
        storage = request.query_params.get("storage")
        if not all([category_id, brand_id, model_name, storage]):
            return Response({"detail": "Thiếu các tham số bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)

        # Lấy danh sách RAM độc bản
        rams_list = TradeInPriceConfig.objects.filter(
            category_id=category_id,
            brand_id=brand_id,
            model_name=model_name,
            storage=storage
        ).values_list("ram", flat=True).distinct()
        
        # Loại bỏ giá trị None/rỗng để tránh lỗi phía Frontend
        rams_list = [r for r in rams_list if r]
        return Response(rams_list)

    @action(detail=False, methods=["get"], url_path="image-url")
    def image_url(self, request):
        category_id = request.query_params.get("category_id")
        brand_id = request.query_params.get("brand_id")
        model_name = request.query_params.get("model_name")
        storage = request.query_params.get("storage")
        ram = request.query_params.get("ram")
        
        if not all([category_id, brand_id, model_name, storage]):
            return Response({"detail": "Thiếu các tham số bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)

        filter_kwargs = {
            "category_id": category_id,
            "brand_id": brand_id,
            "model_name": model_name,
            "storage": storage,
        }
        if ram:
            filter_kwargs["ram"] = ram
            
        config = TradeInPriceConfig.objects.filter(**filter_kwargs).first()
        # Fallback trong trường hợp truyền RAM lên nhưng cấu hình lưu trong DB không có RAM
        if not config and ram:
            filter_kwargs.pop("ram")
            config = TradeInPriceConfig.objects.filter(**filter_kwargs, ram__isnull=True).first() or \
                     TradeInPriceConfig.objects.filter(**filter_kwargs, ram="").first()
                     
        if not config or not config.image_url:
            return Response({"image_url": ""})
            
        return Response({"image_url": config.image_url})