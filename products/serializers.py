from rest_framework import serializers
from .models import Product, Category, Brand

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'
class ProductSerializer(serializers.ModelSerializer):
    seller = serializers.ReadOnlyField(source='seller.username')
    category = serializers.ReadOnlyField(source='category.name')
    brand = serializers.ReadOnlyField(source='brand.name')

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('seller', 'slug', 'is_sold', 'created_at')
    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)