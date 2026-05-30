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
                    {"label": "cracked", "confidence": 0.5},
                    {"label": "display_defect", "confidence": 0.5},
                    {"label": "good", "confidence": 0.5},
                    {"label": "scratch", "confidence": 0.5},
                ],
                "is_mock": True
            }
            
        try:
            # 1. Đọc và chuyển đổi ảnh sang RGB sử dụng PIL
            image = Image.open(image_file).convert("RGB")
            
            # 2. Resize ảnh về kích thước input của mô hình (224x224)
            image = image.resize((224, 224))
            
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

    @staticmethod
    def predict_multiple(image_files) -> dict:
        """
        Đầu vào: image_files (danh sách các đối tượng file ảnh từ Django)
        Đầu ra: kết quả tổng hợp tình trạng màn hình từ nhiều ảnh dựa trên độ ưu tiên lỗi
        """
        results = []
        for img_file in image_files:
            res = DamageDetectionService.predict(img_file)
            results.append(res)
            
        if not results:
            return {
                "screen_status": "good",
                "predictions": [
                    {"label": "cracked", "confidence": 0.0},
                    {"label": "display_defect", "confidence": 0.0},
                    {"label": "good", "confidence": 1.0},
                    {"label": "scratch", "confidence": 0.0},
                ],
                "is_mock": True
            }
            
        status_list = [r["screen_status"] for r in results]
        
        # 1. Tìm các ảnh có lỗi nặng: 'cracked' hoặc 'display_defect'
        heavy_errors = []
        for r in results:
            status = r["screen_status"]
            if status in ["cracked", "display_defect"]:
                # Lấy độ tin cậy (confidence) của lớp tương ứng
                conf = 0.0
                for p in r.get("predictions", []):
                    if p["label"] == status:
                        conf = p["confidence"]
                        break
                heavy_errors.append((status, conf, r))
                
        if heavy_errors:
            # Sắp xếp theo confidence giảm dần để lấy lớp có confidence cao nhất
            heavy_errors.sort(key=lambda x: x[1], reverse=True)
            final_status = heavy_errors[0][0]
            final_predictions = heavy_errors[0][2]["predictions"]
            is_mock = any(r.get("is_mock", False) for r in results)
        # 2. Nếu không có lỗi nặng nhưng có lỗi nhẹ 'scratch'
        elif "scratch" in status_list:
            final_status = "scratch"
            scratch_preds = None
            for r in results:
                if r["screen_status"] == "scratch":
                    scratch_preds = r["predictions"]
                    break
            final_predictions = scratch_preds if scratch_preds else results[0]["predictions"]
            is_mock = any(r.get("is_mock", False) for r in results)
        # 3. Mọi ảnh đều 'good' (nguyên vẹn)
        else:
            final_status = "good"
            final_predictions = results[0]["predictions"]
            is_mock = any(r.get("is_mock", False) for r in results)
            
        return {
            "screen_status": final_status,
            "predictions": final_predictions,
            "is_mock": is_mock,
            "detail_results": results
        }

