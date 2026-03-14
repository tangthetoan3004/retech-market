import json
import logging

from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import (
    PaymentDetailSerializer,
    PaymentConfirmSerializer,
    PaymentFailSerializer,
    PaymentRefundSerializer,
)
from .services import PaymentService
from .utils.zalopay import verify_callback

logger = logging.getLogger(__name__)


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


@method_decorator(csrf_exempt, name="dispatch")
class ZaloPayCallbackView(APIView):
    """POST /api/payments/zalopay-callback/ — Webhook nhận callback từ ZaloPay Server."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data.get("data", "")
        mac = request.data.get("mac", "")

        if not verify_callback(data, mac):
            logger.warning("ZaloPay callback: invalid MAC")
            return Response({"return_code": -1, "return_message": "mac not equal"})

        try:
            data_json = json.loads(data)
            app_trans_id = data_json.get("app_trans_id", "")
            zp_trans_id = str(data_json.get("zp_trans_id", ""))

            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(
                    transaction_ref=app_trans_id,
                    status=Payment.Status.PENDING,
                )
                payment.transaction_ref = zp_trans_id
                payment.save(update_fields=["transaction_ref", "updated_at"])
                payment.change_status(Payment.Status.COMPLETED)

            logger.info("ZaloPay callback: Payment #%s COMPLETED (zp_trans_id=%s)", payment.id, zp_trans_id)
            return Response({"return_code": 1, "return_message": "success"})

        except Payment.DoesNotExist:
            logger.warning("ZaloPay callback: Payment not found for app_trans_id=%s", app_trans_id)
            return Response({"return_code": -1, "return_message": "payment not found"})
        except Exception as e:
            logger.exception("ZaloPay callback error: %s", e)
            return Response({"return_code": 0, "return_message": "exception"})


class PaymentStatusView(APIView):
    """GET /api/payments/<id>/status/ — Frontend polling trạng thái thanh toán."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk, user=request.user)
        except Payment.DoesNotExist:
            return Response({"detail": "Không tìm thấy giao dịch."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "id": payment.id,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "amount": payment.amount,
            "transaction_ref": payment.transaction_ref,
        })
