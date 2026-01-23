from django.db import models
from users.models import User

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.ImageField(upload_to='categories/', blank=True, null=True)
    def __str__(self):
        return self.name
class Brand(models.Model):
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    def __str__(self):
        return self.name
class Product(models.Model):
    CONDITION_CHOICES = [
        ('NEW', 'New (100%)'),
        ('LIKE_NEW', 'Like New (90-99%)'),
        ('GOOD', 'Good (90-98%)'),
        ('FAIR', 'Fair (80-89%)'),
        ('POOR', 'Poor (<80%)'),
    ]
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True)

    name = models.CharField(max_length=225)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=0)
    original_price = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    battery_health = models.IntegerField(help_text='Battery health percentage', blank=True, null=True)
    warranty_period = models.IntegerField(help_text='Warranty period in months', default=0)
    main_image = models.ImageField(upload_to='products/')
    is_sold = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.name} - {self.get_condition_display()}"