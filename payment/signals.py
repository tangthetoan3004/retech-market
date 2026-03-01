from orders.models import Order
from tradein.models import TradeInRequest
from .models import Payment


def on_payment_completed(payment: Payment) -> None:
    """
    Được gọi bởi PaymentService.confirm_payment() sau khi status = COMPLETED.
    Xử lý tuỳ payment_type.
    """
    if payment.payment_type == Payment.PaymentType.TRADEIN_SELL_PAYOUT:
        # SELL: Payment hoàn tất → TradeIn → COMPLETED
        tradein = payment.tradein_request
        tradein.change_status(TradeInRequest.Status.COMPLETED)

    elif payment.payment_type == Payment.PaymentType.TRADEIN_EXCHANGE:
        # EXCHANGE: Payment hoàn tất → Order PENDING → DELIVERED → TradeIn → COMPLETED
        tradein = payment.tradein_request
        exchange_order = tradein.exchange_order
        order = exchange_order.order

        order.change_status(Order.Status.DELIVERED)
        tradein.change_status(TradeInRequest.Status.COMPLETED)

    elif payment.payment_type == Payment.PaymentType.ORDER:
        # Order thường: tuỳ payment_method
        order = payment.order
        if payment.payment_method == Payment.PaymentMethod.BANK_TRANSFER:
            # Đã nhận tiền chuyển khoản → chuyển sang xử lý đơn
            if order.status == Order.Status.PENDING:
                order.change_status(Order.Status.PROCESSING)
        elif payment.payment_method == Payment.PaymentMethod.COD:
            # Shipper giao hàng xong, nhận tiền → DELIVERED
            if order.status == Order.Status.SHIPPED:
                order.change_status(Order.Status.DELIVERED)


def on_payment_failed(payment: Payment) -> None:
    """
    Được gọi bởi PaymentService.fail_payment() sau khi status = FAILED.
    Nếu payment_type = ORDER và Order đang PENDING → tự động huỷ Order + revert is_sold.
    """
    if payment.payment_type == Payment.PaymentType.ORDER:
        order = payment.order
        if order and order.status == Order.Status.PENDING:
            from orders.services import OrderService
            OrderService.cancel_order(order)
