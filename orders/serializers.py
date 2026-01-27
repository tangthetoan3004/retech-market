from rest_framework import serializers
from .models import Order, OrderItem
from django.db import transaction
from products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    class Meta:
        model = OrderItem
        fields = ('product', 'quantity')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, write_only=True)
    full_name = serializers.CharField(required=True, max_length=255)
    phone_number = serializers.CharField(required=True, max_length=20)
    shipping_address = serializers.CharField(required=True, max_length=800)
    payment_method = serializers.CharField(required=True, max_length=50)

    total_amount = serializers.DecimalField(max_digits=12, decimal_places=0, read_only=True)
    final_amount = serializers.DecimalField(max_digits=12, decimal_places=0, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('id', 'status', 'created_at')

    def create(self, validated_data):
        request = self.context.get('request')
        items_data = validated_data.pop('items')

        total_amount = 0
        with transaction.atomic():
            order = Order.objects.create(user=request.user, status='PROCESSING', **validated_data)
            for item in items_data:
                product = item['product']
                quantity = item['quantity']
                price = product.price
                total_amount += price * quantity
                OrderItem.objects.create(order=order, product=product, quantity=quantity, price=price)
            order.total_amount = total_amount
            order.final_amount = total_amount 
            order.save()
        return order
