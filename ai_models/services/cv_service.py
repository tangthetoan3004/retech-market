from .model_loader import ModelLoader

class DamageDetectionService:
    @staticmethod
    def predict(image_file) -> dict:
        """
        Input: image file object
        Output: damage predictions and score
        """
        model = ModelLoader.get_cv_model()
        
        # Nếu đang dùng mock model, trả về kết quả giả định
        if model == "MOCK_CV_MODEL":
            return {
                "predictions": [
                    {"label": "screen_cracked", "confidence": 0.85},
                    {"label": "body_scratched", "confidence": 0.60},
                ],
                "damage_score": 0.75,
                "is_mock": True
            }
            
        # TODO: Implement real image preprocessing and ONNX inference
        # 1. Read image with OpenCV/PIL
        # 2. Resize to 224x224, Normalize
        # 3. model.run(None, {input_name: img_data})
        # 4. Map output to class labels
        return {
            "predictions": [],
            "damage_score": 0.0,
            "is_mock": False
        }
