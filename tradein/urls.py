from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TradeInViewSet

router = DefaultRouter()
router.register(r'', TradeInViewSet, basename='tradein')
urlpatterns = [
    path('', include(router.urls)),
]