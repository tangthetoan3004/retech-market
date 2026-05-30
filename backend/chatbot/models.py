from django.db import models
from django.conf import settings
from products.models import Product

class WebsiteDocument(models.Model):
    title = models.CharField(max_length=255, verbose_name="Tiêu đề")
    content = models.TextField(verbose_name="Nội dung")
    url_path = models.CharField(max_length=255, blank=True, null=True, verbose_name="Đường dẫn URL")
    is_active = models.BooleanField(default=True, verbose_name="Kích hoạt")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")
    embedding = models.JSONField(null=True, blank=True, verbose_name="Vector Embedding (JSON)")

    class Meta:
        verbose_name = "Tài liệu Website"
        verbose_name_plural = "Tài liệu Website"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title


class ProductEmbedding(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="chatbot_embedding", verbose_name="Sản phẩm")
    embedding = models.JSONField(null=True, blank=True, verbose_name="Vector Embedding (JSON)")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        verbose_name = "Embedding Sản phẩm"
        verbose_name_plural = "Embedding Sản phẩm"

    def __str__(self):
        return f"Embedding of {self.product.name}"


class ChatSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_sessions",
        verbose_name="Người dùng"
    )
    session_key = models.CharField(max_length=100, unique=True, verbose_name="Mã phiên chat")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        verbose_name = "Phiên Chat"
        verbose_name_plural = "Phiên Chat"
        ordering = ["-updated_at"]

    def __str__(self):
        if self.user:
            return f"Session {self.session_key} - User: {self.user.username}"
        return f"Session {self.session_key} - Guest"


class ChatMessage(models.Model):
    SENDER_CHOICES = [
        ("user", "Khách hàng"),
        ("bot", "Trợ lý ảo")
    ]

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages", verbose_name="Phiên chat")
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES, verbose_name="Người gửi")
    message = models.TextField(verbose_name="Tin nhắn")
    citations = models.JSONField(null=True, blank=True, verbose_name="Tài liệu tham chiếu (Citations)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    class Meta:
        verbose_name = "Tin nhắn"
        verbose_name_plural = "Tin nhắn"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.sender.upper()}] in Session {self.session.session_key}: {self.message[:50]}..."
