import random
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from faker import Faker
from users.models import User
from products.models import Product, Category, Brand
from orders.models import Order, OrderItem
from tradein.models import TradeInRequest

fake = Faker()

class Command(BaseCommand):
    help = 'Seed database with dummy data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))

        # Create Category & Brand
        categories = ['Phones', 'Laptops', 'Tablets', 'Smartwatches', 'Accessories']
        brands = ['Apple', 'Samsung', 'Dell', 'Lenovo', 'Asus', 'Sony', 'Xiaomi', 'Acer', 'Iphone', 'Vivo']

        db_categories = []
        for category_name in categories:
            category, created = Category.objects.get_or_create(name=category_name, slug=slugify(category_name))
            db_categories.append(category)
        
        db_brands = []
        for brand_name in brands:
            brand, created = Brand.objects.get_or_create(name=brand_name)
            db_brands.append(brand)

        # Create Users
        users = []
        for _ in range(10):
            username = fake.user_name()
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=fake.email(),
                    password='123456789',
                    phone_number=f"09{fake.random_number(digits=8)}"
                )
                users.append(user)
        
        if User.objects.filter(is_superuser=True).exists():
            users.append(User.objects.filter(is_superuser=True).first())

        # Create Products
        conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']
        for _ in range(50):
            name = f"{random.choice(brands)} {fake.word().capitalize()} {random.randint(10, 20)}"
            Product.objects.create(
                seller=random.choice(users),
                category=random.choice(db_categories),
                brand=random.choice(db_brands),
                name=name,
                slug=slugify(name + '-' + str(random.randint(1000, 9999))),
                description=fake.text(),
                price=random.randint(100, 2000) * 10000,
                condition=random.choice(conditions),
                battery_health=random.randint(80, 100),
                main_image=None, 
            )
        
        # Create Orders
        status_list = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED']
        all_products = list(Product.objects.all())
        
        for _ in range(20):
            user = random.choice(users)
            order = Order.objects.create(
                user=user,
                full_name=user.username,
                phone_number=user.phone_number or "0912345678",
                shipping_address=fake.address(),
                status=random.choice(status_list),
                payment_method='COD',
                total_amount=0 
            )
            
            order_items_count = random.randint(1, 3)
            current_products = random.sample(all_products, order_items_count)
            total = 0
            
            for p in current_products:
                OrderItem.objects.create(
                    order=order,
                    product=p,
                    price=p.price,
                    quantity=1
                )
                total += p.price
            
            order.total_amount = total
            order.final_amount = total 
            order.save()
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded: {len(db_categories)} Cats, {len(db_brands)} Brands, 50 Products, 20 Orders!'))

        

