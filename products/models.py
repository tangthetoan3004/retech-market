from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.conf import settings


class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    pass


class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)

    objects = ActiveManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.save(update_fields=["is_deleted"])

    def hard_delete(self):
        super().delete()


class SlugModel(models.Model):
    slug = models.SlugField(unique=True, blank=True, db_index=True, null=True)

    class Meta:
        abstract = True

    def generate_unique_slug(self, base_field="name"):
        base_slug = slugify(getattr(self, base_field))
        slug = base_slug
        counter = 1

        ModelClass = self.__class__

        while ModelClass.all_objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug


class Category(SoftDeleteModel, SlugModel):
    name = models.CharField(max_length=100, unique=True)
    icon = models.ImageField(upload_to="categories/", blank=True, null=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["slug"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_unique_slug("name")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Brand(SoftDeleteModel, SlugModel):
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["slug"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_unique_slug("name")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(SoftDeleteModel, SlugModel):

    CONDITION_CHOICES = [
        ("NEW", "New (100%)"),
        ("LIKE_NEW", "Like New (90-99%)"),
        ("GOOD", "Good (90-98%)"),
        ("FAIR", "Fair (80-89%)"),
        ("POOR", "Poor (<80%)"),
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="products",
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        null=True,
        blank=True,
    )

    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="products",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=225)
    description = models.TextField(blank=True, null=True)

    price = models.DecimalField(max_digits=12, decimal_places=0)
    original_price = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True)

    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default="GOOD")
    battery_health = models.IntegerField(blank=True, null=True)
    warranty_period = models.IntegerField(default=0)

    main_image = models.ImageField(upload_to="products/", blank=True, null=True)

    is_sold = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category"]),
            models.Index(fields=["brand"]),
            models.Index(fields=["is_sold"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["price"]),
        ]

    def clean(self):
        if self.original_price and self.original_price < self.price:
            raise ValidationError("Original price must be >= price.")

        if self.battery_health is not None:
            if not (0 <= self.battery_health <= 100):
                raise ValidationError("Battery health must be between 0 and 100.")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_unique_slug("name")

        self.full_clean()  
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.get_condition_display()}"