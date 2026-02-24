from rest_framework import serializers
from django.db import transaction
from .models import Product, Category, Brand



class ProductSerializer(serializers.ModelSerializer):
    seller_username = serializers.ReadOnlyField(source="seller.username")
    category_name = serializers.ReadOnlyField(source="category.name")
    brand_name = serializers.ReadOnlyField(source="brand.name")

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "original_price",
            "category",
            "brand",
            "condition",
            "battery_health",
            "warranty_period",
            "main_image",
            "is_sold",
            "created_at",
            "seller_username",
            "category_name",
            "brand_name",
        )
        read_only_fields = (
            "seller",
            "slug",
            "is_sold",
            "created_at",
        )

    def validate_main_image(self, value):
        if not value:
            return value

        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Kích thước ảnh tối đa là 5MB.")

        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        if hasattr(value, "content_type") and value.content_type not in allowed_types:
            raise serializers.ValidationError("Chỉ chấp nhận JPG, PNG hoặc WEBP.")

        return value

    def validate(self, data):
        instance = getattr(self, "instance", None)
        price = data.get("price", getattr(instance, "price", None))
        original_price = data.get(
            "original_price", getattr(instance, "original_price", None)
        )
        battery_health = data.get(
            "battery_health", getattr(instance, "battery_health", None)
        )
        warranty_period = data.get(
            "warranty_period", getattr(instance, "warranty_period", 0)
        )
        is_sold = getattr(instance, "is_sold", False)

        if instance and is_sold:
            raise serializers.ValidationError("Sản phẩm đã bán, không thể chỉnh sửa.")

        if price is not None and price < 0:
            raise serializers.ValidationError(
                {"price": "Giá bán không được nhỏ hơn 0."}
            )

        if (
            original_price is not None
            and price is not None
            and original_price < price
        ):
            raise serializers.ValidationError(
                {"original_price": "Giá gốc phải lớn hơn hoặc bằng giá hiện tại."}
            )

        if battery_health is not None and not (0 <= battery_health <= 100):
            raise serializers.ValidationError(
                {"battery_health": "Phần trăm pin phải từ 0 đến 100."}
            )
        if warranty_period is not None and warranty_period < 0:
            raise serializers.ValidationError(
                {"warranty_period": "Thời gian bảo hành không được âm."}
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        validated_data["seller"] = self.context["request"].user
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "icon",
        )
        read_only_fields = ("slug",)


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "slug",
            "logo",
        )
        read_only_fields = ("slug",)