from django.db import models
from users.models import User
from products.models import Product
from tradein.models import TradeInRequest

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    tradein_request = models.OneToOneField(TradeInRequest, on_delete=models.SET_NULL, null=True, blank=True)

    total_amount = models.DecimalField(max_digits=12, decimal_places=0)
    final_amount = models.DecimalField(max_digits=12, decimal_places=0)

    status = models.CharField(max_length=20, default='PROCESSING')
    shipping_address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'Order #{self.id} by {self.user.username}'
