from django.core.exceptions import ValidationError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.cache import CacheManager
from .models import Order, Refund
from .pagination import OrderPagination
from .serializers import (
    OrderCreateSerializer,
    OrderReadSerializer,
    OrderStatusUpdateSerializer,
    RefundSerializer,
)
from .services import OrderService, RefundService


class OrderViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
      GET    /orders/            — Danh sách đơn hàng (User: của mình, Staff: tất cả)
      POST   /orders/            — Tạo đơn hàng mới
      GET    /orders/{id}/       — Chi tiết đơn hàng
      PATCH  /orders/{id}/       — Cập nhật trạng thái (chỉ Staff)
      POST   /orders/{id}/cancel — Hủy đơn hàng (User chỉ được hủy của mình)
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = OrderPagination
    http_method_names  = ["get", "post", "patch", "head", "options"]  

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action in ["partial_update", "update"]:
            return OrderStatusUpdateSerializer
        return OrderReadSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Order.objects.select_related("user")
            .prefetch_related("items__product")
        )
        if user.is_staff:
            return queryset
        return queryset.filter(user=user)

    def get_permissions(self):
        if self.action in ["partial_update", "update"]:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        user = request.user
        page = request.query_params.get("page", "1")

        if user.is_staff:
            return super().list(request, *args, **kwargs)

        cache_key = f"orders:user:{user.id}:page:{page}"

        def get_paginated_data():
            queryset   = self.filter_queryset(self.get_queryset())
            page_obj   = self.paginate_queryset(queryset)
            if page_obj is not None:
                serializer = self.get_serializer(page_obj, many=True)
                return self.get_paginated_response(serializer.data).data
            serializer = self.get_serializer(queryset, many=True)
            return serializer.data

        cached_data = CacheManager.get_or_set(cache_key, get_paginated_data, timeout=60 * 3)
        return Response(cached_data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            product_ids = [item['product_id'] for item in serializer.validated_data['items']]
            order = OrderService.create_order(user=request.user, product_ids=product_ids)
            CacheManager.invalidate_pattern(f"orders:user:{request.user.id}")
            read_serializer = OrderReadSerializer(order, context={"request": request})
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            new_status = serializer.validated_data.get('status')
            order = OrderService.update_order_status(
                order=instance, 
                new_status=new_status, 
                requesting_user=request.user
            )
            CacheManager.invalidate_pattern(f"orders:user:{order.user.id}")
            read_serializer = OrderReadSerializer(order, context={"request": request})
            return Response(read_serializer.data)
        except ValidationError as e:
            return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """POST /api/orders/{id}/cancel/ — Cho phép User tự hủy đơn của mình."""
        order = self.get_object()
        try:
            OrderService.cancel_order(order)
            CacheManager.invalidate_pattern(f"orders:user:{request.user.id}")
            return Response(
                {"status": "Đơn hàng đã được hủy thành công."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RefundViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
      GET  /refunds/              — Danh sách refund (User: của mình, Staff: tất cả)
      POST /refunds/              — Tạo yêu cầu hoàn tiền
      POST /refunds/{id}/approve  — Staff duyệt hoàn tiền
      POST /refunds/{id}/reject   — Staff từ chối hoàn tiền
    """
    serializer_class   = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Refund.objects.select_related("order__user")
            .prefetch_related("refund_items__order_item__product")
        )
        if user.is_staff:
            return queryset
        return queryset.filter(order__user=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order_id = serializer.validated_data.pop('order_id')
            refund = RefundService.create_refund(
                order_id=order_id, 
                user=request.user, 
                validated_data=serializer.validated_data
            )
            CacheManager.invalidate_pattern(f"orders:user:{request.user.id}")
            return Response(
                RefundSerializer(refund, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """POST /api/refunds/{id}/approve/ — Staff duyệt hoàn tiền."""
        refund = self.get_object()
        try:
            RefundService.approve_refund(refund)
            CacheManager.invalidate_pattern(f"orders:user:{refund.order.user.id}")
            return Response(
                {"status": "Refund approved."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """POST /api/refunds/{id}/reject/ — Staff từ chối hoàn tiền với lý do."""
        refund = self.get_object()
        reject_reason = request.data.get("reject_reason", "").strip()
        try:
            RefundService.reject_refund(refund, reject_reason)
            return Response(
                {"status": "Refund rejected.", "reject_reason": reject_reason},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
