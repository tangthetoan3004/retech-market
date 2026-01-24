from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'status', 'total_amount', 'final_amount']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)