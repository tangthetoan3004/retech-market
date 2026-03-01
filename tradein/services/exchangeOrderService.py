from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from orders.models import Order, OrderItem
from tradein.models import TradeInRequest, ExchangeOrder


class ExchangeOrderService:

    @staticmethod
    @transaction.atomic
    def create_exchange_order(tradein: TradeInRequest) -> ExchangeOrder:
        """
        Được gọi bởi TradeInService.approve_tradein() — không gọi trực tiếp từ View.
        Tạo Order (status=PENDING) + OrderItem + ExchangeOrder.
        difference_amount = target_product.price - tradein.final_price.
        Lưu ý: target_product.is_sold đã = True từ lúc tạo TradeInRequest,
                không cần check lại ở đây.
        """
        target_product = tradein.target_product
        if not target_product:
            raise ValidationError("TradeInRequest không có target_product.")

        # Tạo Order cho Exchange
        order = Order.objects.create(
            user=tradein.user,
            total_amount=target_product.price,
        )

        OrderItem.objects.create(
            order=order,
            product=target_product,
            price_snapshot=target_product.price,
        )

        difference_amount = target_product.price - tradein.final_price

        exchange_order = ExchangeOrder.objects.create(
            tradein_request=tradein,
            order=order,
            difference_amount=difference_amount,
        )

        return exchange_order
