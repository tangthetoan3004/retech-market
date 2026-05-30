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
        self.assertIn("screen_status", result)
        self.assertTrue(result["is_mock"])
        self.assertIsInstance(result["predictions"], list)
        self.assertIsInstance(result["screen_status"], str)

    @patch('ai_models.services.cv_service.DamageDetectionService.predict')
    def test_predict_multiple_all_good(self, mock_predict):
        # Kiểm thử trường hợp tất cả ảnh đều nguyên vẹn (good)
        mock_predict.side_effect = [
            {"screen_status": "good", "predictions": [{"label": "good", "confidence": 0.9}], "is_mock": True},
            {"screen_status": "good", "predictions": [{"label": "good", "confidence": 0.85}], "is_mock": True}
        ]
        result = DamageDetectionService.predict_multiple([None, None])
        self.assertEqual(result["screen_status"], "good")

    @patch('ai_models.services.cv_service.DamageDetectionService.predict')
    def test_predict_multiple_with_scratch(self, mock_predict):
        # Kiểm thử trường hợp có ảnh bị trầy xước (scratch) nhưng không có lỗi nặng
        mock_predict.side_effect = [
            {"screen_status": "good", "predictions": [{"label": "good", "confidence": 0.95}], "is_mock": True},
            {"screen_status": "scratch", "predictions": [{"label": "scratch", "confidence": 0.8}], "is_mock": True}
        ]
        result = DamageDetectionService.predict_multiple([None, None])
        self.assertEqual(result["screen_status"], "scratch")

    @patch('ai_models.services.cv_service.DamageDetectionService.predict')
    def test_predict_multiple_with_heavy_errors_priority(self, mock_predict):
        # Kiểm thử trường hợp có nhiều ảnh lỗi nặng (cracked, display_defect), chọn ảnh có độ tin cậy cao hơn
        mock_predict.side_effect = [
            {
                "screen_status": "cracked", 
                "predictions": [{"label": "cracked", "confidence": 0.75}], 
                "is_mock": True
            },
            {
                "screen_status": "display_defect", 
                "predictions": [{"label": "display_defect", "confidence": 0.85}], 
                "is_mock": True
            }
        ]
        result = DamageDetectionService.predict_multiple([None, None])
        # display_defect có confidence 0.85 > cracked 0.75 nên kết quả cuối cùng phải là display_defect
        self.assertEqual(result["screen_status"], "display_defect")


class AIPricingServiceTests(TestCase):
    def test_predict_price_returns_mock_format(self):
        device_data = {
            "brand_id": 1,
            "category_id": 1,
            "model_name": "iPhone 13",
            "storage": "128GB",
            "is_power_on": True,
            "screen": "good",
            "body": "good",
        }
        damage_preds = [
            {"label": "cracked", "confidence": 0.85}
        ]
        
        result = AIPricingService.predict_price(device_data, damage_preds)
        
        self.assertIn("ai_estimated_price", result)
        self.assertIsInstance(result["ai_estimated_price"], Decimal)
        self.assertIn("confidence_interval", result)
        self.assertIn("low", result["confidence_interval"])
        self.assertIn("high", result["confidence_interval"])
