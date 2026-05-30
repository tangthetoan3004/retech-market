from decimal import Decimal
import logging

from products.models import Product
from tradein.models import TradeInPriceConfig
from ai_models.services.price_service import AIPricingService

logger = logging.getLogger(__name__)

class PricingService:

    @staticmethod
    def estimate_price(data: dict) -> dict:
        """
        Chiến lược: AI-first, rule-based fallback.
        
        Input: {
            brand_id, category_id, model_name, storage,
            is_power_on, screen, body,
            tradein_type, ai_damage_predictions (optional)
        }

        Output: {
            "estimated_price": Decimal | None,
            "pricing_method": "AI" | "RULE_BASED",
            "ai_confidence_interval": dict | None
        }
        """
        estimated_price = None
        pricing_method = "RULE_BASED"
        ai_data = None
        config = None  # Khởi tạo mặc định để tránh NameError khi AI thành công
        
        # 1. Thử AI Pricing trước
        try:
            ai_damage_predictions = data.get("ai_damage_predictions", [])
            ai_result = AIPricingService.predict_price(data, ai_damage_predictions)
            
            estimated_price = ai_result.get("ai_estimated_price")
            pricing_method = "AI"
            ai_data = ai_result
        except Exception as e:
            logger.error(f"AI Pricing Service failed: {e}")
            
        # 2. Rule-based Fallback (nếu AI lỗi hoặc trả về None/0)
        if not estimated_price or estimated_price <= 0:
            pricing_method = "RULE_BASED"
            filter_kwargs = {
                "brand_id": data["brand_id"],
                "category_id": data["category_id"],
                "model_name": data["model_name"],
                "storage": data.get("storage", ""),
            }
            if "ram" in data and data["ram"]:
                filter_kwargs["ram"] = data["ram"]
            config = TradeInPriceConfig.objects.filter(**filter_kwargs).first()

            if not config:
                result = {"estimated_price": None}
                return result

            price = config.base_price

            if not data.get("is_power_on", True):
                price -= config.power_off_deduction

            # Khấu trừ dựa trên tình trạng màn hình (screen)
            import json
            screen_status = data.get("screen", "good")
            try:
                screen_deductions = json.loads(config.screen) if config.screen else {}
            except Exception:
                screen_deductions = {}
            screen_deduction = screen_deductions.get(screen_status, 0)
            price -= Decimal(str(screen_deduction))

            # Khấu trừ dựa trên tình trạng thân máy (body)
            body_status = data.get("body", "good")
            try:
                body_deductions = json.loads(config.body) if config.body else {}
            except Exception:
                body_deductions = {}
            body_deduction = body_deductions.get(body_status, 0)
            price -= Decimal(str(body_deduction))

            estimated_price = price


        result: dict = {
            "estimated_price": estimated_price,
            "pricing_method": pricing_method,
        }
        
        if pricing_method == "AI" and ai_data:
            result["ai_confidence_interval"] = ai_data.get("confidence_interval")

        return result
