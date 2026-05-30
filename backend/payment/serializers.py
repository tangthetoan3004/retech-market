from rest_framework import serializers

from .models import Payment


class PaymentDetailSerializer(serializers.ModelSerializer):
    user_email           = serializers.ReadOnlyField(source="user.email")
    confirmed_by_email   = serializers.ReadOnlyField(source="confirmed_by.email")
    payment_type_display = serializers.SerializerMethodField()
    direction_display    = serializers.SerializerMethodField()
    status_display       = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id", "user", "user_email",
            "payment_type", "payment_type_display",
            "payment_method", "direction", "direction_display",
            "status", "status_display", "amount",
            "order", "tradein_request",
            "note", "transaction_ref",
            "confirmed_by", "confirmed_by_email", "confirmed_at",
            "created_at", "updated_at",
        ]

    def get_payment_type_display(self, obj):
        return obj.get_payment_type_display()

    def get_direction_display(self, obj):
        return obj.get_direction_display()

    def get_status_display(self, obj):
        return obj.get_status_display()


class PaymentConfirmSerializer(serializers.Serializer):
    """Staff xác nhận thanh toán."""
    payment_method  = serializers.ChoiceField(choices=Payment.PaymentMethod.choices)
    transaction_ref = serializers.CharField(max_length=255, required=False, allow_blank=True)
    note            = serializers.CharField(required=False, allow_blank=True)


class PaymentFailSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)


class PaymentRefundSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)
