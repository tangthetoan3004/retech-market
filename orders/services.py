from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from products.models import Product
from .models import Order, OrderItem, Refund, RefundItem


class OrderService:

    @staticmethod
    @transaction.atomic
    def create_order(user, product_ids: list[int]) -> Order:
        if not product_ids:
            raise ValidationError("Đơn hàng phải có ít nhất một sản phẩm.")

        locked_products = list(
            Product.objects.select_for_update()
            .filter(id__in=product_ids, is_sold=False, is_deleted=False)
        )

        if len(locked_products) != len(product_ids):
            found_ids = {p.id for p in locked_products}
            missing   = set(product_ids) - found_ids
            raise ValidationError(
                f"Một hoặc nhiều sản phẩm không khả dụng (đã bán hoặc không tồn tại). "
                f"ID không hợp lệ: {list(missing)}"
            )

        order = Order.objects.create(user=user)

        order_items  = []
        total_amount = Decimal("0")
        for product in locked_products:
            order_items.append(
                OrderItem(order=order, product=product, price_snapshot=product.price)
            )
            total_amount      += product.price
            product.is_sold    = True  

        OrderItem.objects.bulk_create(order_items)
        Product.objects.bulk_update(locked_products, ["is_sold"])

        order.total_amount = total_amount
        order.save(update_fields=["total_amount", "updated_at"])

        return order

    @staticmethod
    @transaction.atomic
    def update_order_status(order: Order, new_status: str, requesting_user) -> Order:
        if not requesting_user.is_staff:
            raise ValidationError("Chỉ Admin mới có quyền thay đổi trạng thái đơn hàng.")

        order = Order.objects.select_for_update().get(pk=order.pk)
        order.change_status(new_status)  
        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(order: Order) -> Order:
        if order.status in [Order.Status.SHIPPED, Order.Status.DELIVERED]:
            raise ValidationError("Không thể hủy đơn hàng khi đã giao hoặc đang giao.")

        order = Order.objects.select_for_update().get(pk=order.pk)
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status", "updated_at"])

        products = [item.product for item in order.items.select_related("product")]
        for p in products:
            p.is_sold = False
        Product.objects.bulk_update(products, ["is_sold"])

        return order


class RefundService:

    @staticmethod
    @transaction.atomic
    def create_refund(order_id: int, user, validated_data: dict) -> Refund:
        try:
            order = Order.objects.select_for_update().get(
                id=order_id,
                user=user,
                status=Order.Status.DELIVERED,
            )
        except Order.DoesNotExist:
            raise ValidationError("Chỉ đơn hàng đã giao thành công mới có thể yêu cầu trả hàng.")

        if hasattr(order, "refund"):
            raise ValidationError("Đơn hàng này đã có yêu cầu hoàn tiền.")

        refund = Refund.objects.create(
            order=order,
            total_refund_amount=order.total_amount,
            **validated_data,
        )

        refund_items = [
            RefundItem(
                refund=refund,
                order_item=item,
                price_snapshot=item.price_snapshot,
            )
            for item in order.items.all()
        ]
        RefundItem.objects.bulk_create(refund_items)

        return refund

    @staticmethod
    @transaction.atomic
    def approve_refund(refund: Refund) -> Refund:
        if refund.status != Refund.RefundStatus.PENDING:
            raise ValidationError("Chỉ có thể duyệt đơn hoàn tiền đang chờ.")

        refund.status = Refund.RefundStatus.APPROVED
        refund.save(update_fields=["status", "updated_at"])

        Order.objects.filter(pk=refund.order_id).update(status=Order.Status.RETURNED)

        products = [item.product for item in refund.order.items.select_related("product")]
        for p in products:
            p.is_sold = False
        Product.objects.bulk_update(products, ["is_sold"])

        return refund

    @staticmethod
    def reject_refund(refund: Refund, reject_reason: str) -> Refund:
        if refund.status != Refund.RefundStatus.PENDING:
            raise ValidationError("Chỉ có thể từ chối đơn đang chờ duyệt.")
        if not reject_reason or not reject_reason.strip():
            raise ValidationError("Cần cung cấp lý do từ chối.")

        refund.status        = Refund.RefundStatus.REJECTED
        refund.reject_reason = reject_reason.strip()
        refund.save(update_fields=["status", "reject_reason", "updated_at"])

        return refund
