from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Sum

class Order(models.Model):

    class Status(models.TextChoices):
        PENDING    = "PENDING",    "Pending"
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED    = "SHIPPED",    "Shipped"
        DELIVERED  = "DELIVERED",  "Delivered"
        CANCELLED  = "CANCELLED",  "Cancelled"
        RETURNED   = "RETURNED",   "Returned"

    ALLOWED_TRANSITIONS: dict[str, list[str]] = {
        Status.PENDING:    [Status.PROCESSING, Status.CANCELLED, Status.DELIVERED],
        Status.PROCESSING: [Status.SHIPPED,    Status.CANCELLED],
        Status.SHIPPED:    [Status.DELIVERED],
        Status.DELIVERED:  [],
        Status.CANCELLED:  [],
        Status.RETURNED:   [],
    }

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        db_index=True,
    )
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=0, default=Decimal("0"))
    created_at   = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def change_status(self, new_status: str) -> None:
        allowed = self.ALLOWED_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValidationError(
                f"Không thể chuyển trạng thái từ '{self.status}' sang '{new_status}'. "
                f"Các trạng thái được phép: {allowed or 'Không có'}."
            )
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])

    def recalculate_total(self) -> None:
        result = self.items.aggregate(total=Sum("price_snapshot"))
        self.total_amount = result["total"] or Decimal("0")
        self.save(update_fields=["total_amount", "updated_at"])

    def __str__(self) -> str:
        return f"Order #{self.id} — {self.user}"

class OrderItem(models.Model):
    order          = models.ForeignKey(Order, related_name="items", on_delete=models.PROTECT)
    product        = models.ForeignKey("products.Product", on_delete=models.PROTECT)
    price_snapshot = models.DecimalField(max_digits=12, decimal_places=0)

    class Meta:
        unique_together = ("order", "product")

    def __str__(self) -> str:
        return f"{self.product.name} — {self.price_snapshot}đ (Order #{self.order_id})"


class Refund(models.Model):

    class RefundStatus(models.TextChoices):
        PENDING  = "PENDING",  "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    order               = models.OneToOneField(Order, on_delete=models.PROTECT, related_name="refund")
    reason_refund       = models.TextField(blank=True, null=True)
    status              = models.CharField(max_length=20, choices=RefundStatus.choices, default=RefundStatus.PENDING, db_index=True)
    total_refund_amount = models.DecimalField(max_digits=12, decimal_places=0)
    reject_reason       = models.TextField(blank=True, null=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Refund #{self.id} for Order #{self.order_id} — {self.status}"

class RefundItem(models.Model):
    refund         = models.ForeignKey(Refund, on_delete=models.CASCADE, related_name="refund_items")
    order_item     = models.OneToOneField(OrderItem, on_delete=models.PROTECT)
    price_snapshot = models.DecimalField(max_digits=12, decimal_places=0)

    def __str__(self) -> str:
        return f"RefundItem #{self.id} — {self.price_snapshot}đ"
