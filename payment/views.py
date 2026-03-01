from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Payment
from .serializers import (
    PaymentDetailSerializer,
    PaymentConfirmSerializer,
    PaymentFailSerializer,
    PaymentRefundSerializer,
)
from .services import PaymentService


class PaymentViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        mapping = {
            "confirm": PaymentConfirmSerializer,
            "fail":    PaymentFailSerializer,
            "refund":  PaymentRefundSerializer,
        }
        return mapping.get(self.action, PaymentDetailSerializer)

    def get_permissions(self):
        if self.action == "my_payments":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        return (
            Payment.objects.select_related("user", "confirmed_by", "order", "tradein_request")
            .all()
        )

    # POST /payments/ — Đã loại bỏ. Payment cho Order tự động tạo khi checkout.
    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Payment cho Order được tạo tự động khi checkout. Endpoint này đã bị loại bỏ."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # POST /payments/{id}/confirm/
    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        payment = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = PaymentService.confirm_payment(
            payment=payment,
            staff_user=request.user,
            payment_method=serializer.validated_data["payment_method"],
            transaction_ref=serializer.validated_data.get("transaction_ref", ""),
            note=serializer.validated_data.get("note", ""),
        )
        return Response(PaymentDetailSerializer(payment).data)

    # POST /payments/{id}/fail/
    @action(detail=True, methods=["post"], url_path="fail")
    def fail(self, request, pk=None):
        payment = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = PaymentService.fail_payment(
            payment=payment,
            staff_user=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(PaymentDetailSerializer(payment).data)

    # POST /payments/{id}/refund/
    @action(detail=True, methods=["post"], url_path="refund")
    def refund(self, request, pk=None):
        payment = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = PaymentService.refund_payment(
            payment=payment,
            staff_user=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(PaymentDetailSerializer(payment).data)

    # GET /payments/my/ — User xem Payment của mình
    @action(detail=False, methods=["get"], url_path="my")
    def my_payments(self, request):
        queryset = self.get_queryset().filter(user=request.user)
        serializer = PaymentDetailSerializer(queryset, many=True)
        return Response(serializer.data)
