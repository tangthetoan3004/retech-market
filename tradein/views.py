from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import TradeInRequest, TradeInTempImage
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


class TradeInViewSet(viewsets.ModelViewSet):

    http_method_names = ["get", "post", "delete", "head", "options"]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]

    def get_permissions(self):
        staff_actions = ["approve", "reject"]
        if self.action in staff_actions:
            return [permissions.IsAdminUser()]
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
            final_price=serializer.validated_data["final_price"],
            staff_note=serializer.validated_data["staff_note"],
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