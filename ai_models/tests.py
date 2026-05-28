from django.test import TestCase
from decimal import Decimal
from unittest.mock import patch, MagicMock

from ai_models.services.model_loader import ModelLoader
from ai_models.services.cv_service import DamageDetectionService
from ai_models.services.price_service import AIPricingService

class DamageDetectionServiceTests(TestCase):
    def test_predict_returns_valid_format_for_mock(self):
        # Đảm bảo model loader trả về mock model nếu chưa có model thật
        result = DamageDetectionService.predict(None)
        self.assertIn("predictions", result)
        self.assertIn("damage_score", result)
        self.assertTrue(result["is_mock"])
        self.assertIsInstance(result["predictions"], list)
        self.assertIsInstance(result["damage_score"], float)


class AIPricingServiceTests(TestCase):
    def test_predict_price_returns_mock_format(self):
        device_data = {
            "brand_id": 1,
            "category_id": 1,
            "model_name": "iPhone 13",
            "storage": "128GB",
            "is_power_on": True,
            "screen_ok": True,
            "body_ok": True,
        }
        damage_preds = [
            {"label": "screen_cracked", "confidence": 0.85}
        ]
        
        result = AIPricingService.predict_price(device_data, damage_preds)
        
        self.assertIn("ai_estimated_price", result)
        self.assertIsInstance(result["ai_estimated_price"], Decimal)
        self.assertIn("confidence_interval", result)
        self.assertIn("low", result["confidence_interval"])
        self.assertIn("high", result["confidence_interval"])
