from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from products.models import Category, Brand
from tradein.models import TradeInPriceConfig


class TradeInOptionsTests(APITestCase):

    def setUp(self):
        # Tạo danh mục mẫu
        self.category_phone = Category.objects.create(name="Điện thoại", slug="dien-thoai")
        self.category_laptop = Category.objects.create(name="Laptop", slug="laptop")
        self.category_tablet = Category.objects.create(name="Máy tính bảng", slug="may-tinh-bang")  # Không cấu hình trade-in

        # Tạo thương hiệu mẫu
        self.brand_apple = Brand.objects.create(name="Apple", slug="apple")
        self.brand_samsung = Brand.objects.create(name="Samsung", slug="samsung")
        self.brand_dell = Brand.objects.create(name="Dell", slug="dell")

        # Cấu hình giá Trade-in mẫu trong database
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_apple,
            model_name="iPhone 14 Pro",
            storage="128GB",
            base_price=15000000
        )
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_apple,
            model_name="iPhone 14 Pro",
            storage="256GB",
            base_price=17000000
        )
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_samsung,
            model_name="Galaxy S23",
            storage="256GB",
            base_price=12000000
        )
        TradeInPriceConfig.objects.create(
            category=self.category_laptop,
            brand=self.brand_dell,
            model_name="XPS 13",
            storage="512GB",
            base_price=18000000
        )

    def test_get_categories_with_tradein_config(self):
        """Kiểm tra API lấy danh sách danh mục có cấu hình trade-in."""
        url = reverse("tradein-options-categories")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Chỉ những danh mục có cấu hình trade-in mới được trả về
        data = response.data
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
            
        category_ids = [cat["id"] for cat in data]
        self.assertIn(self.category_phone.id, category_ids)
        self.assertIn(self.category_laptop.id, category_ids)
        self.assertNotIn(self.category_tablet.id, category_ids)

    def test_get_brands_by_category(self):
        """Kiểm tra API lấy danh sách thương hiệu theo danh mục."""
        url = reverse("tradein-options-brands")
        
        # Thử nghiệm không gửi category_id
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Lấy thương hiệu cho danh mục Điện thoại
        response = self.client.get(url, {"category_id": self.category_phone.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
            
        brand_ids = [b["id"] for b in data]
        self.assertIn(self.brand_apple.id, brand_ids)
        self.assertIn(self.brand_samsung.id, brand_ids)
        self.assertNotIn(self.brand_dell.id, brand_ids)

    def test_get_models_by_category_and_brand(self):
        """Kiểm tra API lấy danh sách dòng máy (model_name) theo danh mục và thương hiệu."""
        url = reverse("tradein-options-models")
        
        # Thử nghiệm thiếu tham số
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Lấy dòng máy cho Điện thoại + Apple
        response = self.client.get(url, {
            "category_id": self.category_phone.id,
            "brand_id": self.brand_apple.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
            
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0], "iPhone 14 Pro")

    def test_get_storages_by_details(self):
        """Kiểm tra API lấy danh sách dung lượng (storage) dựa trên thông tin đầy đủ."""
        url = reverse("tradein-options-storages")
        
        # Thử nghiệm thiếu tham số
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Lấy dung lượng cho Điện thoại + Apple + iPhone 14 Pro
        response = self.client.get(url, {
            "category_id": self.category_phone.id,
            "brand_id": self.brand_apple.id,
            "model_name": "iPhone 14 Pro"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
            
        self.assertEqual(len(data), 2)
        self.assertIn("128GB", data)
        self.assertIn("256GB", data)
