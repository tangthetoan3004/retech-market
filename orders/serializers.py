from rest_framework import serializers

from .models import Order, OrderItem, Refund, RefundItem

class OrderItemReadSerializer(serializers.ModelSerializer):
    product_name  = serializers.ReadOnlyField(source="product.name")
    product_slug  = serializers.ReadOnlyField(source="product.slug")

    class Meta:
        model  = OrderItem
        fields = ["id", "product", "product_name", "product_slug", "price_snapshot"]


class OrderItemWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)


class OrderReadSerializer(serializers.ModelSerializer):
    items      = OrderItemReadSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField(source="user.email")
    status_display = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            "id", "user_email", "status", "status_display",
            "total_amount", "items", "created_at", "updated_at",
        ]

    def get_status_display(self, obj: Order) -> str:
        return obj.get_status_display()


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemWriteSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Đơn hàng phải có ít nhất một sản phẩm.")
        ids = [item["product_id"] for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Danh sách sản phẩm bị trùng lặp.")
        return value

class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)

class RefundItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="order_item.product.name")

    class Meta:
        model  = RefundItem
        fields = ["id", "order_item", "product_name", "price_snapshot"]


class RefundSerializer(serializers.ModelSerializer):
    refund_items = RefundItemSerializer(many=True, read_only=True)
    order_id     = serializers.IntegerField(write_only=True, min_value=1)

    class Meta:
        model  = Refund
        fields = [
            "id", "order_id", "reason_refund", "status",
            "total_refund_amount", "reject_reason",
            "refund_items", "created_at",
        ]
        read_only_fields = ["status", "total_refund_amount", "reject_reason"]
