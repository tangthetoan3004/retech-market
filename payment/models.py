from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Payment(models.Model):

    class PaymentType(models.TextChoices):
        ORDER                = "ORDER",                "Thanh toán đơn hàng"
        TRADEIN_SELL_PAYOUT  = "TRADEIN_SELL_PAYOUT",  "Chi trả trade-in (bán lại)"
        TRADEIN_EXCHANGE     = "TRADEIN_EXCHANGE",     "Thanh toán trade-in (đổi máy)"

    class PaymentMethod(models.TextChoices):
        CASH            = "CASH",            "Tiền mặt"
        COD             = "COD",             "Thanh toán khi nhận hàng"
        ZALOPAY         = "ZALOPAY",         "Ví ZaloPay"

    class Direction(models.TextChoices):
        INBOUND  = "INBOUND",  "User trả tiền cho cửa hàng"
        OUTBOUND = "OUTBOUND", "Cửa hàng trả tiền cho User"

    class Status(models.TextChoices):
        PENDING   = "PENDING",   "Chờ thanh toán"
        COMPLETED = "COMPLETED", "Hoàn tất"
        FAILED    = "FAILED",    "Thất bại"
        REFUNDED  = "REFUNDED",  "Đã hoàn tiền"

    ALLOWED_TRANSITIONS = {
        Status.PENDING:   [Status.COMPLETED, Status.FAILED],
        Status.COMPLETED: [Status.REFUNDED],
        Status.FAILED:    [],
        Status.REFUNDED:  [],
    }

    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payments", db_index=True)
    payment_type    = models.CharField(max_length=30, choices=PaymentType.choices, db_index=True)
    payment_method  = models.CharField(max_length=20, choices=PaymentMethod.choices)
    direction       = models.CharField(max_length=10, choices=Direction.choices)
    status          = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    amount          = models.DecimalField(max_digits=12, decimal_places=0)
    # ↑ Luôn dương. Hướng tiền xác định bởi field `direction`.

    # Liên kết — nullable, tuỳ loại thanh toán
    order            = models.ForeignKey("orders.Order", on_delete=models.PROTECT, null=True, blank=True, related_name="payments")
    tradein_request  = models.ForeignKey("tradein.TradeInRequest", on_delete=models.PROTECT, null=True, blank=True, related_name="payments")

    # Metadata
    note             = models.TextField(blank=True)
    transaction_ref  = models.CharField(max_length=255, blank=True)
    # ↑ Mã giao dịch ngân hàng (nếu chuyển khoản)

    # Xác nhận bởi Staff
    confirmed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="confirmed_payments")
    confirmed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "payment_type"]),
            models.Index(fields=["tradein_request", "status"]),
            models.Index(fields=["order", "status"]),
        ]

    def change_status(self, new_status: str) -> None:
        allowed = self.ALLOWED_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValidationError(f"Không thể chuyển từ '{self.status}' sang '{new_status}'.")
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return f"Payment #{self.id} — {self.payment_type} — {self.amount}đ — {self.status}"
