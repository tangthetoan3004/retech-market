from PIL import Image
import numpy as np
import logging
from .model_loader import ModelLoader

logger = logging.getLogger(__name__)

class DamageDetectionService:
    @staticmethod
    def predict(image_file) -> dict:
        """
        Đầu vào: image_file (đối tượng file ảnh từ Django)
        Đầu ra: dự đoán tình trạng màn hình và độ tin cậy
        """
        model = ModelLoader.get_cv_model()
        
        # Nếu đang dùng mock model, trả về kết quả giả định
        if model == "MOCK_CV_MODEL":
            return {
                "screen_status": "scratch",
                "predictions": [
                    {"label": "cracked", "confidence": 0.05},
                    {"label": "display_defect", "confidence": 0.10},
                    {"label": "good", "confidence": 0.15},
                    {"label": "scratch", "confidence": 0.70},
                ],
                "is_mock": True
            }
            
        try:
            # 1. Đọc và chuyển đổi ảnh sang RGB sử dụng PIL
            image = Image.open(image_file).convert("RGB")
            
            # 2. Resize ảnh về kích thước input của mô hình (224x224), dùng BILINEAR giống training pipeline
            image = image.resize((224, 224), Image.BILINEAR)
            
            # 3. Chuẩn hóa ảnh (chia cho 255.0 và normalize theo chuẩn ImageNet)
            img_data = np.array(image).astype(np.float32) / 255.0
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            img_data = (img_data - mean) / std
            
            # 4. Chuyển đổi định dạng từ HWC sang CHW và thêm batch dimension (BCHW)
            img_data = np.transpose(img_data, (2, 0, 1))
            img_data = np.expand_dims(img_data, axis=0)
            
            # 5. Chạy ONNX inference
            input_name = model.get_inputs()[0].name
            raw_outputs = model.run(None, {input_name: img_data})[0]  # Output shape: (1, 4)
            
            # 6. Tính toán xác suất bằng hàm Softmax
            exp_outputs = np.exp(raw_outputs - np.max(raw_outputs, axis=1, keepdims=True))
            probabilities = exp_outputs / np.sum(exp_outputs, axis=1, keepdims=True)
            prob = probabilities[0]
            
            # Định nghĩa đúng 4 lớp đầu ra của model cv của người dùng
            classes = ["cracked", "display_defect", "good", "scratch"]
            pred_idx = int(np.argmax(prob))
            detected_label = classes[pred_idx]
            
            predictions = [
                {"label": classes[i], "confidence": float(prob[i])}
                for i in range(len(classes))
            ]
            
            return {
                "screen_status": detected_label,
                "predictions": predictions,
                "is_mock": False
            }
        except Exception as e:
            logger.error(f"Lỗi khi chạy ONNX CV Model: {e}")
            # Fallback về kết quả giả định nếu có lỗi xảy ra
            return {
                "screen_status": "good",
                "predictions": [
                    {"label": "cracked", "confidence": 0.0},
                    {"label": "display_defect", "confidence": 0.0},
                    {"label": "good", "confidence": 1.0},
                    {"label": "scratch", "confidence": 0.0},
                ],
                "error": str(e),
                "is_mock": True
            }

