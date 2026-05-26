import sys
from django.apps import AppConfig


class AiModelsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_models'
    
    def ready(self):
        # Trigger model loading when app starts, but ONLY if running the server.
        # Ngăn chặn nạp model khi chạy migrate, collectstatic, shell...
        is_running_server = 'runserver' in sys.argv or any('gunicorn' in arg or 'uvicorn' in arg for arg in sys.argv)
        
        if is_running_server:
            from .services.model_loader import ModelLoader
            try:
                ModelLoader.get_cv_model()
                ModelLoader.get_price_model()
            except Exception as e:
                print(f"Warning: AI models could not be loaded on startup: {e}")
