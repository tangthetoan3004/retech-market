from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils.timezone import now

from orders.models import Order
from orders.services import OrderService
from payment.models import Payment
from payment.services import PaymentService
from payment.signals import on_payment_completed, on_payment_failed
from payment.tasks import auto_fail_expired_bank_transfer_payments
from products.models import Product, Category, Brand

User = get_user_model()


class PaymentModelTests(TestCase):
    """PM-01 ~ PM-08"""

    def setUp(self):
        self.user = User.objects.create_user(username="payer", password="pass1234")
        self.seller = User.objects.create_user(username="seller", password="pass1234")
        self.product = Product.objects.create(seller=self.seller, name="Test", price=100000)
        self.order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method="ZALOPAY",
        )
        self.payment = self.order.payments.first()

    def test_pm01_create_payment_valid(self):
        self.assertEqual(self.payment.status, Payment.Status.PENDING)
        self.assertEqual(self.payment.payment_type, Payment.PaymentType.ORDER)
        self.assertEqual(self.payment.payment_method, "ZALOPAY")
        self.assertEqual(self.payment.direction, Payment.Direction.INBOUND)

    def test_pm02_change_status_pending_to_completed(self):
        self.payment.change_status(Payment.Status.COMPLETED)
        self.assertEqual(self.payment.status, Payment.Status.COMPLETED)

    def test_pm03_change_status_pending_to_failed(self):
        self.payment.change_status(Payment.Status.FAILED)
        self.assertEqual(self.payment.status, Payment.Status.FAILED)

    def test_pm04_change_status_completed_to_refunded(self):
        self.payment.change_status(Payment.Status.COMPLETED)
        self.payment.change_status(Payment.Status.REFUNDED)
        self.assertEqual(self.payment.status, Payment.Status.REFUNDED)

    def test_pm05_change_status_failed_to_completed_invalid(self):
        self.payment.change_status(Payment.Status.FAILED)
        with self.assertRaises(ValidationError):
            self.payment.change_status(Payment.Status.COMPLETED)

    def test_pm06_change_status_completed_to_failed_invalid(self):
        self.payment.change_status(Payment.Status.COMPLETED)
        with self.assertRaises(ValidationError):
            self.payment.change_status(Payment.Status.FAILED)

    def test_pm07_change_status_refunded_invalid(self):
        self.payment.change_status(Payment.Status.COMPLETED)
        self.payment.change_status(Payment.Status.REFUNDED)
        with self.assertRaises(ValidationError):
            self.payment.change_status(Payment.Status.PENDING)


class PaymentServiceTests(TestCase):
    """PS-01 ~ PS-07"""

    def setUp(self):
        self.user = User.objects.create_user(username="payer", password="pass1234")
        self.staff = User.objects.create_user(username="staff1", password="pass1234", is_staff=True)
        self.seller = User.objects.create_user(username="seller", password="pass1234")
        self.product = Product.objects.create(seller=self.seller, name="Phone", price=100000)

    def _make_order_with_payment(self, method="ZALOPAY"):
        order = OrderService.create_order(
            user=self.user, product_ids=[self.product.id], payment_method=method,
        )
        return order, order.payments.first()

    def test_ps01_confirm_payment_from_pending(self):
        order, payment = self._make_order_with_payment()
        result = PaymentService.confirm_payment(
            payment=payment, staff_user=self.staff, payment_method="ZALOPAY",
        )
        self.assertEqual(result.status, Payment.Status.COMPLETED)
        self.assertEqual(result.confirmed_by, self.staff)
        self.assertIsNotNone(result.confirmed_at)

    def test_ps02_confirm_payment_triggers_order_processing(self):
        order, payment = self._make_order_with_payment("ZALOPAY")
        PaymentService.confirm_payment(
            payment=payment, staff_user=self.staff, payment_method="ZALOPAY",
        )
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PROCESSING)

    def test_ps03_fail_payment_from_pending(self):
        order, payment = self._make_order_with_payment()
        result = PaymentService.fail_payment(payment=payment, staff_user=self.staff)
        self.assertEqual(result.status, Payment.Status.FAILED)

    def test_ps04_fail_payment_triggers_cancel_order(self):
        order, payment = self._make_order_with_payment()
        PaymentService.fail_payment(payment=payment, staff_user=self.staff)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_sold)

    def test_ps05_fail_payment_completed_invalid(self):
        order, payment = self._make_order_with_payment()
        payment.change_status(Payment.Status.COMPLETED)
        with self.assertRaises(ValidationError):
            PaymentService.fail_payment(payment=payment, staff_user=self.staff)

    def test_ps06_refund_payment_from_completed(self):
        order, payment = self._make_order_with_payment()
        payment.change_status(Payment.Status.COMPLETED)
        result = PaymentService.refund_payment(payment=payment, staff_user=self.staff)
        self.assertEqual(result.status, Payment.Status.REFUNDED)

    def test_ps07_refund_payment_from_pending_invalid(self):
        order, payment = self._make_order_with_payment()
        with self.assertRaises(ValidationError):
            PaymentService.refund_payment(payment=payment, staff_user=self.staff)


class PaymentSignalTests(TestCase):
    """SG-01 ~ SG-06"""

    def setUp(self):
        self.user = User.objects.create_user(username="payer", password="pass1234")
        self.staff = User.objects.create_user(username="staff1", password="pass1234", is_staff=True)
        self.seller = User.objects.create_user(username="seller", password="pass1234")

    def _make_product(self, name="P"):
        return Product.objects.create(seller=self.seller, name=name, price=100000)

    def test_sg01_on_payment_completed_order_zalopay(self):
        product = self._make_product("ZP1")
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="ZALOPAY",
        )
        payment = order.payments.first()
        payment.change_status(Payment.Status.COMPLETED)
        on_payment_completed(payment)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PROCESSING)

    def test_sg02_on_payment_completed_order_cod_shipped(self):
        product = self._make_product("COD1")
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="COD",
        )
        order.change_status(Order.Status.PROCESSING)
        order.change_status(Order.Status.SHIPPED)
        payment = order.payments.first()
        payment.change_status(Payment.Status.COMPLETED)
        on_payment_completed(payment)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DELIVERED)

    def test_sg03_on_payment_completed_cod_pending_stays(self):
        product = self._make_product("COD2")
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="COD",
        )
        payment = order.payments.first()
        payment.change_status(Payment.Status.COMPLETED)
        on_payment_completed(payment)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PENDING)

    def test_sg04_on_payment_failed_order_pending_cancels(self):
        product = self._make_product("F1")
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="ZALOPAY",
        )
        payment = order.payments.first()
        payment.change_status(Payment.Status.FAILED)
        on_payment_failed(payment)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        product.refresh_from_db()
        self.assertFalse(product.is_sold)

    def test_sg05_on_payment_failed_order_processing_stays(self):
        product = self._make_product("F2")
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="ZALOPAY",
        )
        order.change_status(Order.Status.PROCESSING)
        payment = order.payments.first()
        payment.change_status(Payment.Status.FAILED)
        on_payment_failed(payment)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PROCESSING)


class CeleryTaskTests(TestCase):
    """CT-01 ~ CT-05"""

    def setUp(self):
        self.user = User.objects.create_user(username="payer", password="pass1234")
        self.seller = User.objects.create_user(username="seller", password="pass1234")

    def _make_expired_zalopay_payment(self):
        product = Product.objects.create(
            seller=self.seller, name=f"E{Product.objects.count()}", price=100000,
        )
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="ZALOPAY",
        )
        payment = order.payments.first()
        Payment.objects.filter(pk=payment.pk).update(created_at=now() - timedelta(minutes=20))
        return payment, order, product

    def test_ct01_task_fails_expired_payments(self):
        p1, o1, pr1 = self._make_expired_zalopay_payment()
        p2, o2, pr2 = self._make_expired_zalopay_payment()
        p3, o3, pr3 = self._make_expired_zalopay_payment()

        result = auto_fail_expired_bank_transfer_payments()
        self.assertIn("3", result)

        for p in [p1, p2, p3]:
            p.refresh_from_db()
            self.assertEqual(p.status, Payment.Status.FAILED)

    def test_ct02_task_no_expired_payments(self):
        product = Product.objects.create(seller=self.seller, name="Fresh", price=100000)
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="ZALOPAY",
        )
        result = auto_fail_expired_bank_transfer_payments()
        self.assertIn("0", result)

    def test_ct03_task_mix_expired_and_fresh(self):
        p1, o1, pr1 = self._make_expired_zalopay_payment()
        product = Product.objects.create(seller=self.seller, name="Fresh2", price=100000)
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="ZALOPAY",
        )
        fresh_payment = order.payments.first()

        result = auto_fail_expired_bank_transfer_payments()
        self.assertIn("1", result)

        p1.refresh_from_db()
        self.assertEqual(p1.status, Payment.Status.FAILED)

        fresh_payment.refresh_from_db()
        self.assertEqual(fresh_payment.status, Payment.Status.PENDING)

    def test_ct04_task_only_zalopay_not_cod(self):
        product = Product.objects.create(seller=self.seller, name="CODProd", price=100000)
        order = OrderService.create_order(
            user=self.user, product_ids=[product.id], payment_method="COD",
        )
        payment = order.payments.first()
        Payment.objects.filter(pk=payment.pk).update(created_at=now() - timedelta(minutes=20))

        result = auto_fail_expired_bank_transfer_payments()
        self.assertIn("0", result)

        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)

    def test_ct05_task_fail_triggers_order_cancel(self):
        p1, o1, pr1 = self._make_expired_zalopay_payment()
        auto_fail_expired_bank_transfer_payments()
        o1.refresh_from_db()
        self.assertEqual(o1.status, Order.Status.CANCELLED)
        pr1.refresh_from_db()
        self.assertFalse(pr1.is_sold)
