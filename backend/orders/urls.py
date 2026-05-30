from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, RefundViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'refunds', RefundViewSet, basename='refunds')

urlpatterns = [
    path('', include(router.urls)),
]