from rest_framework import serializers

class ImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Ảnh không được vượt quá 5 MB.")
        return value

class AIPredictPriceSerializer(serializers.Serializer):
    # Features thiết bị
    brand_id = serializers.IntegerField(required=False, allow_null=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    model_name = serializers.CharField(max_length=255)
    storage = serializers.CharField(max_length=50, required=False, allow_blank=True)
    is_power_on = serializers.BooleanField(default=True)
    screen_ok = serializers.BooleanField(default=True)
    body_ok = serializers.BooleanField(default=True)
    battery_percentage = serializers.IntegerField(min_value=0, max_value=100)
    
    # CV output (tùy chọn)
    ai_damage_predictions = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_null=True
    )
