import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Brand
from products.serializers import BrandSerializer
from rest_framework.exceptions import ValidationError

def test_drf_validation():
    # 1. Clean up
    for b in Brand.all_objects.filter(name='TestUnique'):
        b.hard_delete()
    
    # 2. Create and soft-delete
    b = Brand.all_objects.create(name='TestUnique')
    b.is_deleted = True
    b.save()
    print(f"Soft-deleted brand exists in all_objects: {Brand.all_objects.filter(name='TestUnique').exists()}")
    print(f"Soft-deleted brand exists in objects: {Brand.objects.filter(name='TestUnique').exists()}")
    
    # 3. Try to validate via Serializer
    data = {'name': 'TestUnique'}
    serializer = BrandSerializer(data=data)
    
    print("Validating serializer...")
    try:
        is_valid = serializer.is_valid(raise_exception=True)
        print(f"Serializer is_valid: {is_valid}")
        print("Data after validation:", serializer.validated_data)
        
        # 4. Try to save
        print("Saving serializer...")
        serializer.save()
        print("Save successful!")
    except ValidationError as e:
        print(f"Validation Error: {e.detail}")
    except Exception as e:
        print(f"Other Error: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    test_drf_validation()
