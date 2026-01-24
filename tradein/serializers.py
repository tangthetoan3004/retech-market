from rest_framework import serializers
from .models import TradeInRequest

class TradeInSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeInRequest
        fields = '__all__'
        read_only_fields = ['estimated_price', 'status', 'created_at']
    def create(self, validated_data):
        # Giả sử giá gốc cho model này là 10tr (Sau này sẽ lấy từ DB/AI)
        base_price = 10000000

        if not validated_data.get('is_power_on', True):
            base_price *= 0.2
        else:
            if not validated_data.get('screen_ok', True):
                base_price -= 2000000
            if not validated_data.get('body_ok', True):
                base_price -= 500000

            battery = validated_data.get('battery_health', 100)
            if battery < 85:
                base_price -= (85 - battery) * 100000
        validated_data['estimated_price'] = max(base_price, 0)
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)