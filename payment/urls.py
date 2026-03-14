from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, ZaloPayCallbackView, PaymentStatusView

router = DefaultRouter()
router.register("", PaymentViewSet, basename="payment")

urlpatterns = [
    path("zalopay-callback/", ZaloPayCallbackView.as_view(), name="zalopay-callback"),
    path("<int:pk>/status/", PaymentStatusView.as_view(), name="payment-status"),
] + router.urls
