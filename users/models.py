from django.db import models
from django.contrib.auth.models import AbstractUser
class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    def __str__(self):
        return self.username


class UserBankAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bank_accounts")
    bank_name = models.CharField(max_length=100)
    account_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "bank_name", "account_number")

    def __str__(self):
        return f"{self.bank_name} - {self.account_number} ({self.account_name})"

