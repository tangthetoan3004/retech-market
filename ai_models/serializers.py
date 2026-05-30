from rest_framework import serializers

class ImageUploadSerializer(serializers.Serializer):
    # Danh sách ảnh tải lên
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=True,
        min_length=1
    )

    def validate_images(self, value):
        # Kiểm tra kích thước của từng ảnh trong danh sách
        for img in value:
            if img.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Mỗi ảnh không được vượt quá 5 MB.")
        return value

class AIPredictPriceSerializer(serializers.Serializer):
    # Features thiết bị
    brand_id = serializers.IntegerField(required=False, allow_null=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    model_name = serializers.CharField(max_length=255)
    storage = serializers.CharField(max_length=50, required=False, allow_blank=True)
    is_power_on = serializers.BooleanField(default=True)
    screen = serializers.CharField(max_length=50, default="good")
    body = serializers.CharField(max_length=50, default="good")
    
    # CV output (tùy chọn)
    ai_damage_predictions = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_null=True
    )
