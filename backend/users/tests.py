from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import UserBankAccount

User = get_user_model()


class UserBankAccountTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password123")
        self.other_user = User.objects.create_user(username="otheruser", password="password123")
        self.bank_account = UserBankAccount.objects.create(
            user=self.user,
            bank_name="Vietcombank",
            account_name="NGUYEN VAN A",
            account_number="1234567890"
        )
        self.url = reverse("bank-account-list")

    def test_list_bank_accounts_unauthenticated(self):
        """Yêu cầu đăng nhập khi lấy danh sách."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_bank_accounts_success(self):
        """Lấy danh sách tài khoản ngân hàng của chính mình."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["bank_name"], "Vietcombank")

    def test_list_bank_accounts_isolation(self):
        """User khác không thấy tài khoản của user này."""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_bank_account_success(self):
        """Tạo mới tài khoản ngân hàng thành công."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "bank_name": "Techcombank",
            "account_name": "NGUYEN VAN A",
            "account_number": "0987654321"
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserBankAccount.objects.filter(user=self.user, bank_name="Techcombank").exists())

    def test_delete_bank_account_success(self):
        """Xóa tài khoản ngân hàng thành công."""
        self.client.force_authenticate(user=self.user)
        detail_url = reverse("bank-account-detail", kwargs={"pk": self.bank_account.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UserBankAccount.objects.filter(id=self.bank_account.id).exists())

