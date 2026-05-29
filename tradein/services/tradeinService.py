from decimal import Decimal
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from products.models import Product
from tradein.models import TradeInRequest, TradeInTempImage, TradeInImage
from tradein.services.pricingService import PricingService



class TradeInService:

    EXPIRY_DAYS = 7

    @staticmethod
    @transaction.atomic
    def create_tradein(user, validated_data: dict, session_key: str) -> TradeInRequest:
        """
        Tạo TradeInRequest mới (User đã xem giá ước tính, đồng ý tới cửa hàng):
          1. Tính estimated_price (PricingService).
          2. Set expires_at = now() + 7 ngày.
          3. (EXCHANGE) select_for_update() trên target_product:
             - Check is_sold == False.
             - Đánh is_sold = True (giữ chỗ sản phẩm cho User).
          4. Move ảnh từ TradeInTempImage → TradeInImage.
          5. Status = PENDING.
        """
        tradein_type = validated_data.get("tradein_type")

        # Tính estimated_price
        estimate_data = {
            "brand_id": validated_data["brand"].id if validated_data.get("brand") else None,
            "category_id": validated_data["category"].id if validated_data.get("category") else None,
            "model_name": validated_data.get("model_name", ""),
            "storage": validated_data.get("storage", ""),
            "ram": validated_data.get("ram", ""),
            "is_power_on": validated_data.get("is_power_on", True),
            "screen": validated_data.get("screen", "good"),
            "body": validated_data.get("body", "good"),
            "tradein_type": tradein_type,
        }
        pricing_result = PricingService.estimate_price(estimate_data)
        est_price = pricing_result.get("estimated_price")

        tradein = TradeInRequest.objects.create(
            user=user,
            estimated_price=est_price,
            final_price=est_price,  # Chốt cứng giá cuối bằng giá ước tính của AI
            expires_at=timezone.now() + timedelta(days=TradeInService.EXPIRY_DAYS),
            **validated_data,
        )

        # Move ảnh tạm → TradeInImage
        temp_images = TradeInTempImage.objects.filter(session_key=session_key, is_used=False)
        trade_images = [
            TradeInImage(tradein=tradein, image=tmp.image)
            for tmp in temp_images
        ]
        TradeInImage.objects.bulk_create(trade_images)
        temp_images.update(is_used=True)

        return tradein

    @staticmethod
    @transaction.atomic
    def approve_tradein(tradein, staff_note: str) -> TradeInRequest:
        """
        Admin xác nhận nhận máy tại cửa hàng.
          1. select_for_update() trên TradeInRequest.
          2. Set staff_note. Giá trị final_price được giữ nguyên như lúc tạo.
          3. Change status: PENDING → APPROVED.
          4. Tạo Payment(PENDING) để giải ngân tự động.
        """
        tradein = TradeInRequest.objects.select_for_update().get(pk=tradein.pk)
        tradein.staff_note = staff_note
        tradein.save(update_fields=["staff_note", "updated_at"])

        tradein.change_status(TradeInRequest.Status.APPROVED)

        # Import inside to avoid circular import
        from payment.services import PaymentService
        PaymentService.create_tradein_payment(tradein)

        return tradein

    @staticmethod
    @transaction.atomic
    def reject_tradein(tradein, reject_reason: str) -> TradeInRequest:
        """
        Admin từ chối (từ PENDING).
        Bắt buộc cung cấp lý do từ chối.
        """
        if not reject_reason or not reject_reason.strip():
            raise ValidationError("Cần cung cấp lý do từ chối.")

        tradein = TradeInRequest.objects.select_for_update().get(pk=tradein.pk)
        tradein.reject_reason = reject_reason.strip()
        tradein.save(update_fields=["reject_reason", "updated_at"])

        tradein.change_status(TradeInRequest.Status.REJECTED)
        return tradein

    @staticmethod
    @transaction.atomic
    def cancel_tradein(tradein, staff_note: str = "") -> TradeInRequest:
        """
        Huỷ TradeInRequest: PENDING → CANCELLED.
        Được gọi bởi User tự huỷ hoặc Celery timeout task.
        """
        tradein = TradeInRequest.objects.select_for_update().get(pk=tradein.pk)

        if staff_note:
            tradein.staff_note = staff_note
            tradein.save(update_fields=["staff_note", "updated_at"])

        if tradein.status != TradeInRequest.Status.PENDING:
            raise ValidationError("Chỉ có thể huỷ TradeInRequest đang ở trạng thái PENDING.")

        tradein.change_status(TradeInRequest.Status.CANCELLED)
        return tradein

    @staticmethod
    def auto_cancel_expired() -> int:
        """
        Celery Beat task — chạy mỗi giờ.
        Tìm tất cả TradeInRequest có status=PENDING và expires_at < now().
        Gọi cancel_tradein() cho từng request.
        Return: số lượng đã cancel.
        """
        now = timezone.now()
        expired_qs = TradeInRequest.objects.filter(
            status=TradeInRequest.Status.PENDING,
            expires_at__lt=now,
        )
        count = 0
        for tradein in expired_qs:
            TradeInService.cancel_tradein(
                tradein,
                staff_note="Hết hạn: User không tới cửa hàng trong 7 ngày",
            )
            count += 1
        return count
