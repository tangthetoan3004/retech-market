from django.test import TestCase
from products.models import vietnamese_slugify, Category

class SlugTestCase(TestCase):
    def test_vietnamese_slugify(self):
        self.assertEqual(vietnamese_slugify("Điện thoại"), "dien-thoai")
        self.assertEqual(vietnamese_slugify("Đồng hồ thông minh"), "dong-ho-thong-minh")
        self.assertEqual(vietnamese_slugify("Máy tính xách tay!"), "may-tinh-xach-tay")

    def test_category_slug_generation(self):
        category = Category.objects.create(name="Đồ gia dụng")
        self.assertEqual(category.slug, "do-gia-dung")
