from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Product, Category, Brand
from .serializers import ProductSerializer, CategorySerializer, BrandSerializer
from .permissions import IsOwnerOrReadOnly
from .pagination import ProductPagination
from core.cache import CacheManager, CacheKey
from users.permissions import IsStaffOrSuperAdmin

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    permission_classes = [IsOwnerOrReadOnly]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'condition']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']

    def get_queryset(self):
        queryset = (
            Product.objects.select_related("seller", "category", "brand")
            .filter(is_sold=False)
        )

        category = self.request.query_params.get("category")
        brand = self.request.query_params.get("brand")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        search = self.request.query_params.get("search")

        if category:
            queryset = queryset.filter(category__slug=category)
        if brand:
            queryset = queryset.filter(brand__slug=brand)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        params = request.query_params.dict()
        
        try:
            page_str = params.get("page", "1")
            page_number = int(page_str) if page_str.isdigit() else 1
        except (ValueError, TypeError):
            page_number = 1

        should_cache = page_number <= 3
        cache_key = CacheKey.make_product_list_key(params)

        if should_cache:
            def db_query():
                return self._get_paginated_data()

            data = CacheManager.get_or_set(cache_key, db_query, timeout=3600)
            return Response(data)

        return Response(self._get_paginated_data())

    def _get_paginated_data(self):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data).data

        serializer = self.get_serializer(queryset, many=True)
        return serializer.data

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        CacheManager.invalidate_pattern("product:list:")

    def perform_update(self, serializer):
        product = serializer.save()
        CacheManager.invalidate_pattern("product:list")
        CacheManager.invalidate(CacheKey.PRODUCT_DETAIL.format(slug=product.slug))

    def perform_destroy(self, instance):
        slug = instance.slug
        instance.delete()
        CacheManager.invalidate_pattern("product:list")
        CacheManager.invalidate(CacheKey.PRODUCT_DETAIL.format(slug=slug))


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffOrSuperAdmin()]

    def list(self, request, *args, **kwargs):
        cache_key = CacheKey.CATEGORY_LIST
        
        def db_query():
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return serializer.data

        data = CacheManager.get_or_set(cache_key, db_query, timeout=3600)
        return Response(data)

    def perform_create(self, serializer):
        serializer.save()
        CacheManager.invalidate(CacheKey.CATEGORY_LIST)

    def perform_update(self, serializer):
        serializer.save()
        CacheManager.invalidate(CacheKey.CATEGORY_LIST)

    def perform_destroy(self, instance):
        instance.delete()
        CacheManager.invalidate(CacheKey.CATEGORY_LIST)


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffOrSuperAdmin()]

    def list(self, request, *args, **kwargs):
        cache_key = CacheKey.BRAND_LIST
        
        def db_query():
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return serializer.data

        data = CacheManager.get_or_set(cache_key, db_query, timeout=3600)
        return Response(data)

    def perform_create(self, serializer):
        serializer.save()
        CacheManager.invalidate(CacheKey.BRAND_LIST)

    def perform_update(self, serializer):
        serializer.save()
        CacheManager.invalidate(CacheKey.BRAND_LIST)

    def perform_destroy(self, instance):
        instance.delete()
        CacheManager.invalidate(CacheKey.BRAND_LIST)