from django.urls import path
from .views import PredictDamageView, PredictPriceView, AIHealthCheckView

urlpatterns = [
    path('predict-damage/', PredictDamageView.as_view(), name='ai-predict-damage'),
    path('predict-price/', PredictPriceView.as_view(), name='ai-predict-price'),
    path('health/', AIHealthCheckView.as_view(), name='ai-health'),
]
