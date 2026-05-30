import os
import joblib
import threading

class ModelLoader:
    _cv_model = None
    _price_model = None
    _lock = threading.Lock()

    @classmethod
    def get_cv_model(cls):
        if cls._cv_model is None:
            with cls._lock:
                if cls._cv_model is None:
                    try:
                        import onnxruntime as ort
                        model_path = os.path.join(os.path.dirname(__file__), '../models/cv_model.onnx')
                        if os.path.exists(model_path):
                            cls._cv_model = ort.InferenceSession(model_path)
                        else:
                            cls._cv_model = "MOCK_CV_MODEL"  # Mock fallback
                    except ImportError:
                        cls._cv_model = "MOCK_CV_MODEL"
        return cls._cv_model

    @classmethod
    def get_price_model(cls):
        if cls._price_model is None:
            with cls._lock:
                if cls._price_model is None:
                    try:
                        model_path = os.path.join(os.path.dirname(__file__), '../models/price_model.joblib')
                        if os.path.exists(model_path):
                            cls._price_model = joblib.load(model_path)
                        else:
                            cls._price_model = "MOCK_PRICE_MODEL"  # Mock fallback
                    except Exception:
                        cls._price_model = "MOCK_PRICE_MODEL"
        return cls._price_model

    @classmethod
    def is_ai_ready(cls) -> bool:
        """Check if real models are loaded instead of mocks."""
        cv = cls.get_cv_model()
        price = cls.get_price_model()
        return cv != "MOCK_CV_MODEL" and price != "MOCK_PRICE_MODEL"
