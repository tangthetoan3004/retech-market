import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

try:
    import onnxruntime as ort
    from transformers import BertTokenizer
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False

class IntentClassifier:
    def __init__(self):
        self.enabled = False
        self.tokenizer = None
        self.session = None
        self.labels = ["tu_van_san_pham", "chinh_sach", "ban_may_cu", "chuyen_phiem"]

        if not ONNX_AVAILABLE:
            logger.warning("Thư viện onnxruntime hoặc transformers chưa được cài đặt. Chatbot sẽ mặc định định tuyến qua RAG.")
            return

        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(current_dir, "models", "intent_classifier.onnx")

        if not os.path.exists(self.model_path):
            logger.warning(
                f"Không tìm thấy file mô hình Intent Classifier tại {self.model_path}. "
                f"Hãy chạy script train_intent_model.py trong thư mục scripts để huấn luyện và tạo mô hình."
            )
            return

        try:
            self.session = ort.InferenceSession(self.model_path)
            self.tokenizer = BertTokenizer.from_pretrained("prajjwal1/bert-tiny")
            self.enabled = True
            logger.info("Đã tải thành công bộ phân loại ý định Intent Classifier (ONNX).")
        except Exception as e:
            logger.error(f"Lỗi khi load mô hình Intent Classifier ONNX: {e}")

    def predict(self, text):
        if not self.enabled or not self.tokenizer or not self.session:
            return "tu_van_san_pham"

        try:
            inputs = self.tokenizer(
                text,
                max_length=32,
                padding='max_length',
                truncation=True,
                return_tensors='np'
            )
            
            onnx_inputs = {
                'input_ids': inputs['input_ids'].astype(np.int64),
                'attention_mask': inputs['attention_mask'].astype(np.int64)
            }
            
            outputs = self.session.run(None, onnx_inputs)
            logits = outputs[0]
            predicted_idx = np.argmax(logits, axis=1)[0]
            
            intent = self.labels[predicted_idx]
            logger.info(f"Dự đoán ý định: '{text}' -> {intent}")
            return intent
        except Exception as e:
            logger.error(f"Lỗi khi dự đoán ý định: {e}")
            return "tu_van_san_pham"
