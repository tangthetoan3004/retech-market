from django.db import models
from users.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class TradeInRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    device_name = models.CharField(max_length=255, help_text='Tên máy cũ (VD: Iphone 11)')
    
    is_power_on = models.BooleanField(default=True, verbose_name='Nguồn còn lên')
    screen_ok = models.BooleanField(default=True, verbose_name='Màn hình không vỡ')
    body_ok = models.BooleanField(default=True, verbose_name='Vỏ đẹp, không cấn móp')
    battery_percentage = models.PositiveSmallIntegerField(
        default=100,
        validators = [MinValueValidator(0), MaxValueValidator(100)],
    )

    estimated_price = models.DecimalField(max_digits=12, decimal_places=0,null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Đang chờ'),
        ('SUBMITTED', 'Đã gửi'),
        ('APPROVED', 'Đã duyệt'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f'Trade-in: {self.device_name} - {self.user.username}'