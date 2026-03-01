from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from tradein.models import TradeInRequest
from .models import Payment
from .signals import on_payment_completed, on_payment_failed


class PaymentService:

    @staticmethod
    @transaction.atomic
    def create_tradein_payment(tradein: TradeInRequest) -> Payment:
        """
        Tự động tạo Payment khi TradeIn được APPROVED.
        Được gọi bởi TradeInService.approve_tradein() — KHÔNG gọi trực tiếp từ View.
        """
        if tradein.tradein_type == TradeInRequest.TradeInType.SELL:
            payment = Payment.objects.create(
                user=tradein.user,
                payment_type=Payment.PaymentType.TRADEIN_SELL_PAYOUT,
                payment_method=Payment.PaymentMethod.CASH,
                direction=Payment.Direction.OUTBOUND,
                amount=tradein.final_price,
                tradein_request=tradein,
            )
        else:
            # EXCHANGE
            exchange_order = tradein.exchange_order
            difference = exchange_order.difference_amount

            if difference > 0:
                direction = Payment.Direction.INBOUND
                amount = difference
            elif difference < 0:
                direction = Payment.Direction.OUTBOUND
                amount = abs(difference)
            else:
                direction = Payment.Direction.INBOUND
                amount = Decimal("0")

            payment = Payment.objects.create(
                user=tradein.user,
                payment_type=Payment.PaymentType.TRADEIN_EXCHANGE,
                payment_method=Payment.PaymentMethod.CASH,
                direction=direction,
                amount=amount,
                tradein_request=tradein,
                order=exchange_order.order,
            )

        return payment

    @staticmethod
    @transaction.atomic
    def confirm_payment(payment: Payment, staff_user, payment_method: str, transaction_ref: str = "", note: str = "") -> Payment:
        """
        Staff xác nhận thanh toán đã hoàn tất.
          1. select_for_update() trên Payment.
          2. Set payment_method, transaction_ref, note (nếu có).
          3. Set confirmed_by = staff_user, confirmed_at = now().
          4. Change status: PENDING → COMPLETED.
          5. Trigger downstream signals.
        """
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        payment.payment_method = payment_method
        if transaction_ref:
            payment.transaction_ref = transaction_ref
        if note:
            payment.note = note
        payment.confirmed_by = staff_user
        payment.confirmed_at = timezone.now()
        payment.save(update_fields=["payment_method", "transaction_ref", "note", "confirmed_by", "confirmed_at", "updated_at"])

        payment.change_status(Payment.Status.COMPLETED)

        # Trigger downstream
        on_payment_completed(payment)

        return payment

    @staticmethod
    @transaction.atomic
    def fail_payment(payment: Payment, staff_user, note: str = "") -> Payment:
        """
        Đánh dấu thanh toán thất bại: PENDING → FAILED.
        Nếu payment_type = ORDER → auto-cancel Order (via signal).
        Trade-in: không auto-cancel, Staff có thể retry.
        """
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if note:
            payment.note = note
        payment.save(update_fields=["note", "updated_at"])

        payment.change_status(Payment.Status.FAILED)

        # Trigger downstream — auto-cancel Order nếu cần
        on_payment_failed(payment)

        return payment

    @staticmethod
    @transaction.atomic
    def refund_payment(payment: Payment, staff_user, note: str = "") -> Payment:
        """
        Hoàn tiền: COMPLETED → REFUNDED.
        Chỉ áp dụng cho Payment loại ORDER (liên kết với Refund app).
        Trade-in không hỗ trợ refund Payment (đã trao tay tại cửa hàng).
        """
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if note:
            payment.note = note
        payment.save(update_fields=["note", "updated_at"])

        payment.change_status(Payment.Status.REFUNDED)
        return payment
