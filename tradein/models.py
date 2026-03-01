from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.conf import settings


class TradeInRequest(models.Model):

    class Status(models.TextChoices):
        PENDING   = "PENDING",   "Chờ tới cửa hàng"       # User đã tạo, hẹn tới trong 7 ngày
        APPROVED  = "APPROVED",  "Đã duyệt"                # Admin kiểm tra tại cửa hàng OK
        REJECTED  = "REJECTED",  "Từ chối"                 # Admin từ chối
        CANCELLED = "CANCELLED", "Đã hủy"                  # Hết hạn 7 ngày / User tự huỷ
        COMPLETED = "COMPLETED", "Hoàn tất"                # Payment hoàn tất

    class TradeInType(models.TextChoices):
        SELL     = "SELL",     "Bán lại"
        EXCHANGE = "EXCHANGE", "Thu cũ đổi mới"

    ALLOWED_TRANSITIONS = {
        Status.PENDING:   [Status.APPROVED, Status.REJECTED, Status.CANCELLED],
        Status.APPROVED:  [Status.COMPLETED],
        Status.REJECTED:  [],
        Status.CANCELLED: [],
        Status.COMPLETED: [],
    }

    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="tradeins", db_index=True)
    tradein_type = models.CharField(max_length=20, choices=TradeInType.choices, db_index=True, null=True, blank=True)
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    # Thông tin thiết bị cũ (User khai báo online)
    brand        = models.ForeignKey("products.Brand", on_delete=models.SET_NULL, null=True)
    category     = models.ForeignKey("products.Category", on_delete=models.SET_NULL, null=True)
    model_name   = models.CharField(max_length=255, null=True, blank=True)
    storage      = models.CharField(max_length=50, blank=True)
    is_power_on  = models.BooleanField(default=True)
    screen_ok    = models.BooleanField(default=True)
    body_ok      = models.BooleanField(default=True)
    battery_percentage = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    description  = models.TextField(blank=True)

    # Giá — 2 bước riêng biệt
    estimated_price = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    # ↑ PricingService tự tính khi User tạo TradeInRequest
    final_price     = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    # ↑ Admin set sau khi kiểm tra tận tay tại cửa hàng (bước APPROVED)

    # Luồng EXCHANGE: sản phẩm user muốn đổi sang
    target_product = models.ForeignKey("products.Product", on_delete=models.SET_NULL, null=True, blank=True, related_name="tradein_targets")

    # Timeout 7 ngày tới cửa hàng
    expires_at = models.DateTimeField(null=True, blank=True)
    # ↑ auto set = created_at + 7 ngày khi tạo

    # Staff
    staff_note    = models.TextField(blank=True)
    reject_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "tradein_type"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["status", "expires_at"]),
        ]

    def change_status(self, new_status: str) -> None:
        allowed = self.ALLOWED_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValidationError(f"Không thể chuyển từ '{self.status}' sang '{new_status}'.")
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])



class TradeInPriceConfig(models.Model):
    class Meta:
        unique_together = ("brand", "category", "model_name", "storage")

    brand = models.ForeignKey("products.Brand", on_delete=models.PROTECT)
    category = models.ForeignKey("products.Category", on_delete=models.PROTECT)
    model_name = models.CharField(max_length=255)
    storage = models.CharField(max_length=50, blank=True)

    base_price = models.DecimalField(max_digits=12, decimal_places=0)

    power_off_deduction = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    screen_broken_deduction = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    body_damage_deduction = models.DecimalField(max_digits=12, decimal_places=0, default=0)

    battery_below_80_deduction = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    battery_below_60_deduction = models.DecimalField(max_digits=12, decimal_places=0, default=0)

    def __str__(self):
        return f"{self.brand} - {self.model_name} - {self.storage}"


class TradeInImage(models.Model):
    tradein     = models.ForeignKey(TradeInRequest, on_delete=models.CASCADE, related_name="images")
    image       = models.ImageField(upload_to="tradeins/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image of {self.tradein.model_name}"


class TradeInTempImage(models.Model):
    """Ảnh tạm trước khi tạo TradeInRequest."""
    session_key = models.UUIDField(db_index=True)
    image       = models.ImageField(upload_to="tradein_temp/")
    is_used     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["session_key", "is_used"]),
        ]


class ExchangeOrder(models.Model):
    tradein_request   = models.OneToOneField(TradeInRequest, on_delete=models.PROTECT, related_name="exchange_order")
    order             = models.OneToOneField("orders.Order", on_delete=models.PROTECT, related_name="exchange_order")
    difference_amount = models.DecimalField(max_digits=12, decimal_places=0)
    created_at        = models.DateTimeField(auto_now_add=True)



