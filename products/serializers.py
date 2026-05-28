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
            "warranty_period",
            "main_image",
            "main_image_url",
            "is_sold",
            "created_at",
            "seller_username",
            "category_name",
            "brand_name",
        )
        read_only_fields = (
            "seller",
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
    name = serializers.CharField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "icon",
        )

    def validate_name(self, value):
        if Category.objects.filter(name=value).exists():
            raise serializers.ValidationError("Danh mục này đã tồn tại.")
        return value

    def create(self, validated_data):
        name = validated_data.get("name")
        instance = Category.all_objects.filter(name=name, is_deleted=True).first()
        if instance:
            instance.is_deleted = False
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        return super().create(validated_data)


class BrandSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "logo_svg",
        )

    def validate_name(self, value):
        if Brand.objects.filter(name=value).exists():
            raise serializers.ValidationError("Thương hiệu này đã tồn tại.")
        return value

    def validate_logo(self, value):
        if not value:
            return value

        if value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError("Kích thước logo tối đa là 2MB.")
        return value

    def create(self, validated_data):
        name = validated_data.get("name")
        instance = Brand.all_objects.filter(name=name, is_deleted=True).first()
        if instance:
            instance.is_deleted = False
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        return super().create(validated_data)