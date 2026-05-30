from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from django.contrib.auth import get_user_model
from products.models import Category, Brand
from tradein.models import TradeInPriceConfig, TradeInRequest, TradeInTempImage
from tradein.services.pricingService import PricingService

User = get_user_model()


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
            base_price=15000000,
            power_off_deduction=2000000,
            screen='{"good": 0, "scratch": 100000, "cracked": 500000, "display_defect": 700000}',
            body='{"good": 0, "scratch": 150000, "cracked": 400000}'
        )
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_apple,
            model_name="iPhone 14 Pro",
            storage="256GB",
            base_price=17000000,
            power_off_deduction=2000000,
            screen='{"good": 0, "scratch": 100000, "cracked": 500000, "display_defect": 700000}',
            body='{"good": 0, "scratch": 150000, "cracked": 400000}'
        )
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_samsung,
            model_name="Galaxy S23",
            storage="256GB",
            base_price=12000000,
            power_off_deduction=1500000,
            screen='{"good": 0, "scratch": 80000, "cracked": 400000, "display_defect": 600000}',
            body='{"good": 0, "scratch": 120000, "cracked": 350000}'
        )
        TradeInPriceConfig.objects.create(
            category=self.category_laptop,
            brand=self.brand_dell,
            model_name="XPS 13",
            storage="512GB",
            base_price=18000000,
            power_off_deduction=3000000,
            screen='{"good": 0, "scratch": 200000, "cracked": 800000, "display_defect": 1000000}',
            body='{"good": 0, "scratch": 250000, "cracked": 600000}'
        )
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_apple,
            model_name="iPhone 14 Pro",
            storage="256GB",
            ram="6GB",
            image_url="http://example.com/iphone14pro.jpg",
            base_price=17500000,
            power_off_deduction=2000000,
            screen='{"good": 0, "scratch": 100000, "cracked": 500000, "display_defect": 700000}',
            body='{"good": 0, "scratch": 150000, "cracked": 400000}'
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

    def test_get_rams_by_details(self):
        """Kiểm tra API lấy danh sách RAM (ram) dựa trên thông tin đầy đủ."""
        # Tạo thêm một config nữa có RAM 8GB để test danh sách RAM trả về
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_apple,
            model_name="iPhone 14 Pro",
            storage="256GB",
            ram="8GB",
            base_price=19000000,
            power_off_deduction=2000000,
        )
        url = reverse("tradein-options-rams")
        
        # Thiếu tham số
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Lấy RAM cho Điện thoại + Apple + iPhone 14 Pro + 256GB
        response = self.client.get(url, {
            "category_id": self.category_phone.id,
            "brand_id": self.brand_apple.id,
            "model_name": "iPhone 14 Pro",
            "storage": "256GB"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        if isinstance(data, dict) and "data" in data:
            data = data["data"]
            
        self.assertEqual(len(data), 2)
        self.assertIn("6GB", data)
        self.assertIn("8GB", data)

    def test_get_image_url_by_details(self):
        """Kiểm tra API lấy image_url dựa trên thông tin cấu hình."""
        url = reverse("tradein-options-image-url")
        
        # Thiếu tham số
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Khớp chính xác có RAM
        response = self.client.get(url, {
            "category_id": self.category_phone.id,
            "brand_id": self.brand_apple.id,
            "model_name": "iPhone 14 Pro",
            "storage": "256GB",
            "ram": "6GB"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data["image_url"], "http://example.com/iphone14pro.jpg")

        # Fallback khi truyền RAM nhưng config không cấu hình RAM
        # Tạo một config không có RAM nhưng có image_url
        TradeInPriceConfig.objects.create(
            category=self.category_phone,
            brand=self.brand_apple,
            model_name="iPhone 14 Pro",
            storage="512GB",
            ram=None,
            image_url="http://example.com/iphone14_512.jpg",
            base_price=15000000,
            power_off_deduction=2000000,
        )
        response = self.client.get(url, {
            "category_id": self.category_phone.id,
            "brand_id": self.brand_apple.id,
            "model_name": "iPhone 14 Pro",
            "storage": "512GB",
            "ram": "6GB"  # Truyền RAM lên nhưng config thực tế không có RAM
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data["image_url"], "http://example.com/iphone14_512.jpg")


class TradeInPricingAndRequestTests(APITestCase):

    def setUp(self):
        # Tạo user
        self.user = User.objects.create_user(username="testuser", password="password123")
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name="Điện thoại", slug="dien-thoai")
        self.brand = Brand.objects.create(name="Apple", slug="apple")

        # Cấu hình giá
        self.config = TradeInPriceConfig.objects.create(
            category=self.category,
            brand=self.brand,
            model_name="iPhone 14 Pro",
            storage="128GB",
            ram="6GB",
            image_url="http://example.com/iphone14.jpg",
            base_price=15000000,
            power_off_deduction=2000000,
            screen='{"good": 0, "scratch": 100000, "cracked": 500000, "display_defect": 700000}',
            body='{"good": 0, "scratch": 150000, "cracked": 400000}'
        )

        # Tạo ảnh tạm để tạo Request
        self.temp_image = TradeInTempImage.objects.create(
            session_key="12345678-1234-1234-1234-123456789012",
            image="test_image.jpg",
            is_used=False
        )

    @patch('tradein.services.pricingService.AIPricingService.predict_price')
    def test_estimate_price_rule_based(self, mock_predict):
        """Kiểm tra logic tính giá của PricingService."""
        # Giả lập AI pricing trả về None để bắt buộc chạy Rule-based fallback
        mock_predict.return_value = {"ai_estimated_price": None}

        # Trường hợp 1: Máy tốt, màn hình nguyên, ngoại hình nguyên
        data = {
            "brand_id": self.brand.id,
            "category_id": self.category.id,
            "model_name": "iPhone 14 Pro",
            "storage": "128GB",
            "ram": "6GB",
            "is_power_on": True,
            "screen": "good",
            "body": "good",
        }
        result = PricingService.estimate_price(data)
        # Giá cơ bản: 15,000,000. Không trừ.
        self.assertEqual(result["estimated_price"], 15000000)

        # Trường hợp 2: Màn hình trầy (trừ 100,000), thân máy xước (trừ 150,000), nguồn tắt (trừ 2,000,000)
        data = {
            "brand_id": self.brand.id,
            "category_id": self.category.id,
            "model_name": "iPhone 14 Pro",
            "storage": "128GB",
            "ram": "6GB",
            "is_power_on": False,
            "screen": "scratch",
            "body": "scratch",
        }
        result = PricingService.estimate_price(data)
        # 15,000,000 - 2,000,000 - 100,000 - 150,000 = 12,750,000
        self.assertEqual(result["estimated_price"], 12750000)

        # Trường hợp 3: Màn hình bị sọc (trừ 700,000), thân máy bể (trừ 400,000)
        data = {
            "brand_id": self.brand.id,
            "category_id": self.category.id,
            "model_name": "iPhone 14 Pro",
            "storage": "128GB",
            "ram": "6GB",
            "is_power_on": True,
            "screen": "display_defect",
            "body": "cracked",
        }
        result = PricingService.estimate_price(data)
        # 15,000,000 - 700,000 - 400,000 = 13,900,000
        self.assertEqual(result["estimated_price"], 13900000)

    @patch('tradein.services.tradeinService.PricingService.estimate_price')
    def test_create_tradein_request_success(self, mock_estimate):
        """Kiểm tra API tạo TradeInRequest mới kèm snapshot tài khoản ngân hàng."""
        # Mock kết quả ước tính giá của PricingService
        mock_estimate.return_value = {"estimated_price": 14500000, "pricing_method": "RULE_BASED"}

        url = reverse("tradein-list")
        payload = {
            "tradein_type": "SELL",
            "brand": self.brand.id,
            "category": self.category.id,
            "model_name": "iPhone 14 Pro",
            "storage": "128GB",
            "ram": "6GB",
            "is_power_on": True,
            "screen": "scratch",
            "body": "cracked",
            "description": "Máy cũ của tôi",
            "session_key": "12345678-1234-1234-1234-123456789012",
            "bank_name": "Vietcombank",
            "bank_account_name": "NGUYEN VAN A",
            "bank_account_number": "1234567890"
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Kiểm tra object được tạo trong DB
        tradein = TradeInRequest.objects.get(id=response.data["id"])
        self.assertEqual(tradein.screen, "scratch")
        self.assertEqual(tradein.body, "cracked")
        self.assertEqual(tradein.ram, "6GB")
        self.assertEqual(tradein.estimated_price, 14500000)
        self.assertEqual(tradein.final_price, 14500000)  # Tự động gán bằng estimated_price
        self.assertEqual(tradein.bank_name, "Vietcombank")
        self.assertEqual(tradein.bank_account_name, "NGUYEN VAN A")
        self.assertEqual(tradein.bank_account_number, "1234567890")

    @patch('tradein.services.tradeinService.PricingService.estimate_price')
    def test_approve_tradein_request_success(self, mock_estimate):
        """Kiểm tra API duyệt TradeInRequest thành APPROVED bởi Staff/Admin."""
        # Tạo tradein request trước
        tradein = TradeInRequest.objects.create(
            user=self.user,
            tradein_type="SELL",
            brand=self.brand,
            category=self.category,
            model_name="iPhone 14 Pro",
            storage="128GB",
            is_power_on=True,
            screen="good",
            body="good",
            estimated_price=14500000,
            final_price=14500000,
            bank_name="Vietcombank",
            bank_account_name="NGUYEN VAN A",
            bank_account_number="1234567890"
        )
        
        # Staff user đăng nhập
        staff_user = User.objects.create_user(username="staffuser", password="password123", is_staff=True)
        self.client.force_authenticate(user=staff_user)
        
        url = reverse("tradein-approve", kwargs={"pk": tradein.id})
        payload = {
            "staff_note": "Kiểm tra máy trực tiếp tốt, phê duyệt thanh toán."
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        tradein.refresh_from_db()
        self.assertEqual(tradein.status, TradeInRequest.Status.APPROVED)
        self.assertEqual(tradein.final_price, 14500000) # Đảm bảo giá trị giữ nguyên không đổi
        self.assertEqual(tradein.staff_note, "Kiểm tra máy trực tiếp tốt, phê duyệt thanh toán.")





