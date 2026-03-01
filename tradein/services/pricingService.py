from decimal import Decimal

from products.models import Product
from tradein.models import TradeInPriceConfig


class PricingService:

    @staticmethod
    def estimate_price(data: dict) -> dict:
        """
        Tính giá ước tính dựa trên TradeInPriceConfig.
        Stateless — KHÔNG lưu DB, chỉ trả về kết quả.

        Input: {
            brand_id, category_id, model_name, storage,
            is_power_on, screen_ok, body_ok, battery_percentage,
            tradein_type, target_product_id (optional)
        }

        Output: {
            "estimated_price": Decimal | None,
            "target_product_price": Decimal | None,
            "difference_amount": Decimal | None,
        }
        """
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

        estimated_price = max(price, Decimal("0"))

        result: dict = {
            "estimated_price": estimated_price,
            "target_product_price": None,
            "difference_amount": None,
        }

        if data.get("tradein_type") == "EXCHANGE" and data.get("target_product_id"):
            try:
                product = Product.objects.get(id=data["target_product_id"], is_sold=False, is_deleted=False)
                result["target_product_price"] = product.price
                result["difference_amount"] = product.price - estimated_price
            except Product.DoesNotExist:
                pass

        return result
