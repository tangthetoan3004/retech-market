from decimal import Decimal
from .model_loader import ModelLoader

class AIPricingService:
    @staticmethod
    def predict_price(device_data: dict, damage_predictions: list = None) -> dict:
        """
        Dự đoán giá thu mua bằng AI.
        Kết hợp features thiết bị + output từ CV model.
        """
        model = ModelLoader.get_price_model()
        
        # Mock logic
        if model == "MOCK_PRICE_MODEL":
            # Simple mock calculation
            base_mock_price = Decimal("5000000")
            
            if damage_predictions:
                for pred in damage_predictions:
                    if pred["label"] == "screen_cracked":
                        base_mock_price -= Decimal("1000000")
                    if pred["label"] == "body_scratched":
                        base_mock_price -= Decimal("300000")
                        
            # Prevent negative
            ai_price = max(base_mock_price, Decimal("500000"))
            
            return {
                "ai_estimated_price": ai_price,
                "confidence_interval": {
                    "low": ai_price - Decimal("500000"),
                    "high": ai_price + Decimal("500000")
                },
                "model_version": "v1.0.0-mock"
            }
            
        # TODO: Real XGBoost inference
        # 1. Feature Engineering (encode categorical, parse booleans)
        # 2. model.predict(X)
        # 3. Return Decimal values
        
        return {
            "ai_estimated_price": Decimal("0"),
            "confidence_interval": {"low": Decimal("0"), "high": Decimal("0")},
            "model_version": "v1.0.0"
        }
