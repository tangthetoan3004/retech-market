from datetime import timedelta

from celery import shared_task
from django.utils.timezone import now

from payment.models import Payment
from payment.services import PaymentService


@shared_task
def auto_fail_expired_bank_transfer_payments():
    """
    Chạy mỗi giờ bởi Celery Beat.
    Tìm Payment BANK_TRANSFER cho ORDER đang PENDING quá 24h → auto-fail.
    on_payment_failed signal sẽ tự động huỷ Order + revert is_sold.
    """
    cutoff = now() - timedelta(hours=24)
    expired_payments = Payment.objects.filter(
        payment_type=Payment.PaymentType.ORDER,
        payment_method=Payment.PaymentMethod.BANK_TRANSFER,
        status=Payment.Status.PENDING,
        created_at__lt=cutoff,
    )
    count = 0
    for payment in expired_payments:
        PaymentService.fail_payment(
            payment=payment,
            staff_user=None,
            note="Tự động huỷ: chưa chuyển khoản sau 24 giờ.",
        )
        count += 1
    return f"Auto-failed {count} expired BANK_TRANSFER payments."
