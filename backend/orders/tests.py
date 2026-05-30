from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from orders.models import Order, OrderItem, Refund, RefundItem
from orders.services import OrderService, RefundService
from payment.models import Payment
from products.models import Product, Category, Brand

User = get_user_model()


class OrderModelTests(TestCase):
    """OM-01 ~ OM-07"""

    def setUp(self):
        self.user = User.objects.create_user(username="buyer", password="pass1234")

    def test_om01_create_order_default(self):
        order = Order.objects.create(user=self.user)
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.total_amount, Decimal("0"))

    def test_om02_change_status_pending_to_processing(self):
        order = Order.objects.create(user=self.user)
        order.change_status(Order.Status.PROCESSING)
        self.assertEqual(order.status, Order.Status.PROCESSING)

    def test_om03_change_status_pending_to_cancelled(self):
        order = Order.objects.create(user=self.user)
        order.change_status(Order.Status.CANCELLED)
        self.assertEqual(order.status, Order.Status.CANCELLED)

    def test_om04_change_status_cancelled_invalid(self):
        order = Order.objects.create(user=self.user, status=Order.Status.CANCELLED)
        with self.assertRaises(ValidationError):
            order.change_status(Order.Status.PENDING)

    def test_om05_change_status_delivered_invalid(self):
        order = Order.objects.create(user=self.user, status=Order.Status.DELIVERED)
        with self.assertRaises(ValidationError):
            order.change_status(Order.Status.PROCESSING)

    def test_om06_recalculate_total(self):
        order = Order.objects.create(user=self.user)
        seller = User.objects.create_user(username="seller", password="pass1234")
        p1 = Product.objects.create(seller=seller, name="P1", price=100000)
        p2 = Product.objects.create(seller=seller, name="P2", price=200000)
        p3 = Product.objects.create(seller=seller, name="P3", price=300000)
        OrderItem.objects.create(order=order, product=p1, price_snapshot=100000)
        OrderItem.objects.create(order=order, product=p2, price_snapshot=200000)
        OrderItem.objects.create(order=order, product=p3, price_snapshot=300000)
        order.recalculate_total()
        self.assertEqual(order.total_amount, Decimal("600000"))

    def test_om07_recalculate_total_no_items(self):
        order = Order.objects.create(user=self.user)
        order.recalculate_total()
        self.assertEqual(order.total_amount, Decimal("0"))


class OrderServiceTests(TestCase):
    """OS-01 ~ OS-12"""

    def setUp(self):
        self.user = User.objects.create_user(username="buyer", password="pass1234")
        self.seller = User.objects.create_user(username="seller", password="pass1234")
        self.cat = Category.objects.create(name="Phones")
        self.brand = Brand.objects.create(name="Apple")
        self.product1 = Product.objects.create(
            seller=self.seller, name="iPhone 12", price=5000000,
            category=self.cat, brand=self.brand,
        )
        self.product2 = Product.objects.create(
            seller=self.seller, name="iPhone 13", price=7000000,
            category=self.cat, brand=self.brand,
        )

    def test_os01_create_order_success(self):
        order = OrderService.create_order(
            user=self.user,
            product_ids=[self.product1.id, self.product2.id],
            payment_method="COD",
            full_name="Nguyen Van A",
            phone="0901234567",
            shipping_address="123 ABC St",
        )
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.items.count(), 2)
        self.assertEqual(order.total_amount, Decimal("12000000"))
        self.assertEqual(order.full_name, "Nguyen Van A")
        self.assertEqual(order.phone, "0901234567")
        self.assertEqual(order.shipping_address, "123 ABC St")
        # Products marked as sold
        self.product1.refresh_from_db()
        self.product2.refresh_from_db()
        self.assertTrue(self.product1.is_sold)
        self.assertTrue(self.product2.is_sold)
        # Payment created
        payment = order.payments.first()
        self.assertIsNotNone(payment)
        self.assertEqual(payment.payment_method, "COD")
        self.assertEqual(payment.status, Payment.Status.PENDING)

    def test_os02_create_order_product_already_sold(self):
        self.product1.is_sold = True
        self.product1.save(update_fields=["is_sold"])
        with self.assertRaises(ValidationError):
            OrderService.create_order(
                user=self.user, product_ids=[self.product1.id], payment_method="COD",
            )

    def test_os03_create_order_empty_products(self):
        with self.assertRaises(ValidationError):
            OrderService.create_order(user=self.user, product_ids=[], payment_method="COD")

    def test_os04_create_order_nonexistent_product(self):
        with self.assertRaises(ValidationError):
            OrderService.create_order(user=self.user, product_ids=[99999], payment_method="COD")

    def test_os05_create_order_zalopay_payment(self):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product1.id], payment_method="ZALOPAY",
        )
        payment = order.payments.first()
        self.assertEqual(payment.payment_method, "ZALOPAY")
        self.assertEqual(payment.direction, Payment.Direction.INBOUND)

    def test_os07_cancel_order_pending(self):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product1.id], payment_method="COD",
        )
        self.product1.refresh_from_db()
        self.assertTrue(self.product1.is_sold)
        cancelled_order = OrderService.cancel_order(order)
        self.assertEqual(cancelled_order.status, Order.Status.CANCELLED)
        self.product1.refresh_from_db()
        self.assertFalse(self.product1.is_sold)

    def test_os08_cancel_order_processing(self):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product1.id], payment_method="COD",
        )
        order.change_status(Order.Status.PROCESSING)
        cancelled_order = OrderService.cancel_order(order)
        self.assertEqual(cancelled_order.status, Order.Status.CANCELLED)

    def test_os09_cancel_order_shipped_invalid(self):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product1.id], payment_method="COD",
        )
        order.change_status(Order.Status.PROCESSING)
        order.change_status(Order.Status.SHIPPED)
        with self.assertRaises(ValidationError):
            OrderService.cancel_order(order)

    def test_os10_cancel_order_delivered_invalid(self):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product1.id], payment_method="COD",
        )
        order.change_status(Order.Status.DELIVERED)
        with self.assertRaises(ValidationError):
            OrderService.cancel_order(order)

    @patch("orders.services.CacheManager.invalidate_pattern")
    def test_os11_create_order_invalidates_product_cache(self, mock_inv):
        OrderService.create_order(
            user=self.user, product_ids=[self.product1.id], payment_method="COD",
        )
        mock_inv.assert_any_call("product:list")

    @patch("orders.services.CacheManager.invalidate_pattern")
    def test_os12_cancel_order_invalidates_product_cache(self, mock_inv):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product1.id], payment_method="COD",
        )
        mock_inv.reset_mock()
        OrderService.cancel_order(order)
        mock_inv.assert_any_call("product:list")


class OrderReadSerializerTests(TestCase):
    """SR-01 ~ SR-04"""

    def setUp(self):
        self.user = User.objects.create_user(username="buyer", password="pass1234")
        self.seller = User.objects.create_user(username="seller", password="pass1234")
        self.product = Product.objects.create(seller=self.seller, name="Test Phone", price=5000000)

    def test_sr01_serialize_order_with_items(self):
        from orders.serializers import OrderReadSerializer
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method="COD",
            full_name="Test User", phone="0123456789",
        )
        data = OrderReadSerializer(order).data
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["product_name"], "Test Phone")
        self.assertEqual(str(data["items"][0]["price_snapshot"]), "5000000")

    def test_sr02_serialize_order_with_payment(self):
        from orders.serializers import OrderReadSerializer
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method="ZALOPAY",
        )
        data = OrderReadSerializer(order).data
        self.assertIsNotNone(data["payment"])
        self.assertEqual(data["payment"]["payment_method"], "ZALOPAY")
        self.assertEqual(data["payment"]["status"], "PENDING")

    def test_sr03_serialize_order_has_shipping_fields(self):
        from orders.serializers import OrderReadSerializer
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method="COD",
            full_name="Tran Van B", phone="0999888777", shipping_address="456 XYZ",
        )
        data = OrderReadSerializer(order).data
        self.assertEqual(data["full_name"], "Tran Van B")
        self.assertEqual(data["phone"], "0999888777")
        self.assertEqual(data["shipping_address"], "456 XYZ")

    def test_sr04_order_items_no_quantity_field(self):
        from orders.serializers import OrderReadSerializer
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method="COD",
        )
        data = OrderReadSerializer(order).data
        self.assertNotIn("quantity", data["items"][0])


class RefundServiceTests(TestCase):
    """RF-01 ~ RF-06"""

    def setUp(self):
        self.user = User.objects.create_user(username="buyer", password="pass1234")
        self.seller = User.objects.create_user(username="seller", password="pass1234")
        self.product = Product.objects.create(seller=self.seller, name="Refund Phone", price=3000000)

    def _make_delivered_order(self):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method="COD",
        )
        order.change_status(Order.Status.DELIVERED)
        return order

    def test_rf01_create_refund_delivered(self):
        order = self._make_delivered_order()
        refund = RefundService.create_refund(order.id, self.user, {"reason_refund": "Faulty"})
        self.assertEqual(refund.status, Refund.RefundStatus.PENDING)
        self.assertEqual(refund.total_refund_amount, order.total_amount)
        self.assertEqual(refund.refund_items.count(), 1)

    def test_rf02_create_refund_pending_invalid(self):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method="COD",
        )
        with self.assertRaises(ValidationError):
            RefundService.create_refund(order.id, self.user, {"reason_refund": "Faulty"})

    def test_rf03_create_refund_duplicate(self):
        order = self._make_delivered_order()
        RefundService.create_refund(order.id, self.user, {"reason_refund": "First"})
        with self.assertRaises(ValidationError):
            RefundService.create_refund(order.id, self.user, {"reason_refund": "Second"})

    @patch("orders.services.CacheManager.invalidate_pattern")
    def test_rf04_approve_refund(self, mock_inv):
        order = self._make_delivered_order()
        refund = RefundService.create_refund(order.id, self.user, {"reason_refund": "Faulty"})
        RefundService.approve_refund(refund)
        refund.refresh_from_db()
        self.assertEqual(refund.status, Refund.RefundStatus.APPROVED)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.RETURNED)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_sold)
        # Cache invalidation called
        mock_inv.assert_any_call("product:list")

    def test_rf05_reject_refund(self):
        order = self._make_delivered_order()
        refund = RefundService.create_refund(order.id, self.user, {"reason_refund": "Faulty"})
        RefundService.reject_refund(refund, "Expired return period")
        refund.refresh_from_db()
        self.assertEqual(refund.status, Refund.RefundStatus.REJECTED)
        self.assertEqual(refund.reject_reason, "Expired return period")

    def test_rf06_reject_refund_no_reason(self):
        order = self._make_delivered_order()
        refund = RefundService.create_refund(order.id, self.user, {"reason_refund": "Faulty"})
        with self.assertRaises(ValidationError):
            RefundService.reject_refund(refund, "")


from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from tradein.models import TradeInRequest

class AdminDashboardAPITests(APITestCase):
    """
    Test các APIs thống kê của Dashboard Admin.
    """
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin_user", password="password", is_staff=True
        )
        self.normal_user = User.objects.create_user(
            username="normal_user", password="password", is_staff=False
        )

        self.brand = Brand.objects.create(name="Apple")
        self.cat = Category.objects.create(name="Phones")
        self.product = Product.objects.create(
            seller=self.admin_user, name="iPhone X", price=10000000,
            category=self.cat, brand=self.brand
        )

        # Tạo Order
        self.order = Order.objects.create(
            user=self.normal_user, total_amount=10000000, status=Order.Status.DELIVERED
        )
        OrderItem.objects.create(
            order=self.order, product=self.product, price_snapshot=10000000
        )

        # Tạo Payment (Doanh thu)
        Payment.objects.create(
            user=self.normal_user,
            payment_type=Payment.PaymentType.ORDER,
            payment_method=Payment.PaymentMethod.COD,
            direction=Payment.Direction.INBOUND,
            status=Payment.Status.COMPLETED,
            amount=10000000,
            order=self.order
        )

        # Tạo Trade-In Request
        self.tradein = TradeInRequest.objects.create(
            user=self.normal_user,
            brand=self.brand,
            category=self.cat,
            model_name="iPhone 11 Pro",
            estimated_price=8000000,
            final_price=7500000,
            status=TradeInRequest.Status.COMPLETED
        )

        # Tạo Payment chi trả thu cũ (Payout)
        Payment.objects.create(
            user=self.normal_user,
            payment_type=Payment.PaymentType.TRADEIN_SELL_PAYOUT,
            payment_method=Payment.PaymentMethod.CASH,
            direction=Payment.Direction.OUTBOUND,
            status=Payment.Status.COMPLETED,
            amount=7500000,
            tradein_request=self.tradein
        )

        # Tạo Refund hoàn tiền
        self.order2 = Order.objects.create(
            user=self.normal_user, total_amount=5000000, status=Order.Status.RETURNED
        )
        self.refund = Refund.objects.create(
            order=self.order2,
            reason_refund="Lỗi màn hình",
            status=Refund.RefundStatus.APPROVED,
            total_refund_amount=5000000
        )

    def test_dashboard_stats_permission_admin(self):
        """Chỉ có admin/staff mới truy cập được API dashboard."""
        url = reverse("admin-dashboard-stats")
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dashboard_stats_permission_denied_for_normal_user(self):
        """Người dùng thường bị từ chối truy cập."""
        url = reverse("admin-dashboard-stats")
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_stats_permission_denied_for_anonymous(self):
        """Khách vãng lai bị từ chối truy cập."""
        url = reverse("admin-dashboard-stats")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_stats_correct_aggregates(self):
        """Kiểm tra độ chính xác của các chỉ số tổng hợp."""
        url = reverse("admin-dashboard-stats")
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        overview = response.data["overview"]
        self.assertEqual(overview["total_revenue"], 10000000)
        self.assertEqual(overview["total_payout"], 7500000)
        self.assertEqual(overview["total_refund"], 5000000)
        self.assertEqual(overview["net_profit"], -2500000)
        self.assertEqual(overview["total_orders"], 2)
        self.assertEqual(overview["total_tradeins"], 1)

        # Kiểm tra sự tồn tại của dữ liệu xu hướng và biểu đồ
        self.assertIn("charts", response.data)
        self.assertTrue(len(response.data["charts"]["trend"]) > 0)
        
        # Kiểm tra distributions
        self.assertIn("distributions", response.data)
        self.assertTrue(len(response.data["distributions"]["orders"]) > 0)
        self.assertTrue(len(response.data["distributions"]["tradeins"]) > 0)

        # Kiểm tra hoạt động gần đây
        self.assertIn("recent_activities", response.data)
        self.assertEqual(len(response.data["recent_activities"]["orders"]), 2)
        self.assertEqual(len(response.data["recent_activities"]["tradeins"]), 1)

