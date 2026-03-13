from django.db import models
from django.contrib.auth.models import AbstractUser
class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    def __str__(self):
        return self.username
