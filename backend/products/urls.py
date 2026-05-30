from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, BrandViewSet

router = DefaultRouter()
router.register(r'items', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)

urlpatterns = [
    path('', include(router.urls)),
]