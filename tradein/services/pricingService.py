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
            is_power_on, screen_ok, body_ok, battery_percentage,
            tradein_type, target_product_id (optional),
            ai_damage_predictions (optional)
        }

        Output: {
            "estimated_price": Decimal | None,
            "target_product_price": Decimal | None,
            "difference_amount": Decimal | None,
            "pricing_method": "AI" | "RULE_BASED",
            "ai_confidence_interval": dict | None
        }
        """
        estimated_price = None
        pricing_method = "RULE_BASED"
        ai_data = None
        
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
            config = TradeInPriceConfig.objects.filter(
            brand_id=data["brand_id"],
            category_id=data["category_id"],
            model_name=data["model_name"],
            storage=data.get("storage", ""),
        ).first()

        if not config:
            result = {"estimated_price": None, "target_product_price": None, "difference_amount": None}
            return result

        price = config.base_price

        if not data.get("is_power_on", True):
            price -= config.power_off_deduction

        if not data.get("screen_ok", True):
            price -= config.screen_broken_deduction

        if not data.get("body_ok", True):
            price -= config.body_damage_deduction

        battery = data.get("battery_percentage", 100)
        if battery < 60:
            price -= config.battery_below_60_deduction
        elif battery < 80:
            price -= config.battery_below_80_deduction
        else:
            estimated_price = None

        result: dict = {
            "estimated_price": estimated_price,
            "target_product_price": None,
            "difference_amount": None,
            "pricing_method": pricing_method,
        }
        
        if pricing_method == "AI" and ai_data:
            result["ai_confidence_interval"] = ai_data.get("confidence_interval")

        if data.get("tradein_type") == "EXCHANGE" and data.get("target_product_id") and estimated_price is not None:
            try:
                product = Product.objects.get(id=data["target_product_id"], is_sold=False, is_deleted=False)
                result["target_product_price"] = product.price
                result["difference_amount"] = product.price - estimated_price
            except Product.DoesNotExist:
                pass

        return result
