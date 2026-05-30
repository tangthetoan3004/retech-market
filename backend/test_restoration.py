import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Brand
from products.serializers import BrandSerializer
from rest_framework import serializers

# Mocking the new serializer behavior inside the script to test the logic
class ImprovedBrandSerializer(BrandSerializer):
    name = serializers.CharField() # Remove default validators
    
    def validate_name(self, value):
        if Brand.objects.filter(name=value).exists():
            raise serializers.ValidationError("Thương hiệu này đã tồn tại.")
        return value

    def create(self, validated_data):
        name = validated_data.get('name')
        instance = Brand.all_objects.filter(name=name, is_deleted=True).first()
        if instance:
            instance.is_deleted = False
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        return super().create(validated_data)

def test_restoration():
    # 1. Clean up
    for b in Brand.all_objects.filter(name='Restorable'):
        b.hard_delete()
    
    # 2. Create and soft-delete
    b = Brand.all_objects.create(name='Restorable', description="Old description")
    b.is_deleted = True
    b.save()
    print(f"Initial state: is_deleted={b.is_deleted}, desc='{b.description}'")
    
    # 3. Try to "create" again via Serializer
    data = {'name': 'Restorable', 'description': 'New description'}
    serializer = ImprovedBrandSerializer(data=data)
    
    if serializer.is_valid():
        print("Serializer is valid!")
        new_brand = serializer.save()
        print(f"Final state: id={new_brand.id}, name='{new_brand.name}', is_deleted={new_brand.is_deleted}, desc='{new_brand.description}'")
        if not new_brand.is_deleted and new_brand.description == 'New description':
            print("RESTORATION SUCCESSFUL!")
        else:
            print("RESTORATION FAILED!")
    else:
        print(f"Validation failed: {serializer.errors}")

if __name__ == "__main__":
    test_restoration()
