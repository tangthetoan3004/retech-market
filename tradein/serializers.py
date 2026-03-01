from rest_framework import serializers
from .models import TradeInRequest, TradeInImage, TradeInTempImage


class TradeInEstimateSerializer(serializers.Serializer):
    """Input cho API estimate (không tạo model)."""
    tradein_type       = serializers.ChoiceField(choices=TradeInRequest.TradeInType.choices)
    brand_id           = serializers.IntegerField()
    category_id        = serializers.IntegerField()
    model_name         = serializers.CharField(max_length=255)
    storage            = serializers.CharField(max_length=50, required=False, allow_blank=True)
    is_power_on        = serializers.BooleanField(default=True)
    screen_ok          = serializers.BooleanField(default=True)
    body_ok            = serializers.BooleanField(default=True)
    battery_percentage = serializers.IntegerField(min_value=0, max_value=100)
    target_product_id  = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if attrs["tradein_type"] == "EXCHANGE" and not attrs.get("target_product_id"):
            raise serializers.ValidationError({"target_product_id": "Bắt buộc khi chọn 'Thu cũ đổi mới'."})
        return attrs


class TradeInCreateSerializer(serializers.ModelSerializer):
    """Tạo TradeInRequest — kèm session_key để liên kết ảnh tạm."""
    session_key = serializers.UUIDField()

    class Meta:
        model = TradeInRequest
        fields = [
            "tradein_type", "brand", "category", "model_name", "storage",
            "is_power_on", "screen_ok", "body_ok", "battery_percentage",
            "description", "target_product", "session_key",
        ]

    def validate(self, attrs):
        if attrs["tradein_type"] == "EXCHANGE" and not attrs.get("target_product"):
            raise serializers.ValidationError({"target_product": "Bắt buộc khi chọn 'Thu cũ đổi mới'."})
        session_key = attrs.get("session_key")
        if not TradeInTempImage.objects.filter(session_key=session_key, is_used=False).exists():
            raise serializers.ValidationError({"session_key": "Chưa upload ảnh nào."})
        return attrs


class TradeInImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeInImage
        fields = ["id", "image", "uploaded_at"]


class TradeInDetailSerializer(serializers.ModelSerializer):
    """Đọc TradeInRequest (thêm payment info)."""
    images  = TradeInImageSerializer(many=True, read_only=True)
    payment = serializers.SerializerMethodField()

    class Meta:
        model = TradeInRequest
        fields = [
            "id", "user", "tradein_type", "status",
            "brand", "category", "model_name", "storage",
            "is_power_on", "screen_ok", "body_ok", "battery_percentage",
            "description", "estimated_price", "final_price",
            "target_product", "expires_at",
            "staff_note", "reject_reason",
            "images", "payment",
            "created_at", "updated_at",
        ]

    def get_payment(self, obj):
        """Trả về Payment mới nhất liên kết với TradeIn (nếu có)."""
        payment = obj.payments.order_by("-created_at").first()
        if payment:
            return {
                "id": payment.id,
                "status": payment.status,
                "amount": payment.amount,
                "direction": payment.direction,
                "payment_method": payment.payment_method,
            }
        return None


class StaffApproveSerializer(serializers.Serializer):
    """Admin set giá cuối tại cửa hàng."""
    final_price = serializers.DecimalField(max_digits=12, decimal_places=0, min_value=1)
    staff_note  = serializers.CharField(allow_blank=True)


class StaffRejectSerializer(serializers.Serializer):
    """Admin từ chối."""
    reject_reason = serializers.CharField(min_length=1)


class TempImageUploadSerializer(serializers.Serializer):
    """Upload ảnh tạm."""
    session_key = serializers.UUIDField()
    image       = serializers.ImageField()

    def validate_image(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Ảnh không được vượt quá 5 MB.")
        return value

    def validate(self, attrs):
        count = TradeInTempImage.objects.filter(
            session_key=attrs["session_key"], is_used=False
        ).count()
        if count >= 5:
            raise serializers.ValidationError("Tối đa 5 ảnh.")
        return attrs