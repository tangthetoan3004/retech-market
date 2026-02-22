# products/views.py

from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category, Brand
from .serializers import ProductSerializer, CategorySerializer, BrandSerializer
from .permissions import IsOwnerOrReadOnly
from core.cache import CacheManager, CacheKey

class ProductViewSet(viewsets.ModelViewSet):
    # ✅ Queryset gốc — KHÔNG thay đổi, để DRF filter backends làm việc bình thường
    queryset = Product.objects.filter(is_sold=False).order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsOwnerOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'condition']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']

    def list(self, request, *args, **kwargs):
        """
        Override list() — Cache toàn bộ response SAU KHI DRF đã filter + paginate xong.
        Đây là điểm caching đúng nhất: 1 cache key = 1 response hoàn chỉnh.
        """
        # ✅ Cache key = toàn bộ query string (bao gồm filters + page + ordering)
        # Ví dụ: ?category=2&page=1&ordering=-price → key riêng biệt
        cache_key = CacheKey.make_product_list_key(dict(request.query_params))

        cached_response = CacheManager.get(cache_key)
        if cached_response is not None:
            return Response(cached_response)  # ✅ HIT: trả ngay, 0 DB query

        # ✅ MISS: Gọi pipeline chuẩn của DRF (filter → paginate → serialize)
        # super().list() tự xử lý toàn bộ, kết quả là response đã hoàn chỉnh
        response = super().list(request, *args, **kwargs)

        # Lưu data vào cache (chỉ lưu .data, không lưu Response object)
        CacheManager.set(cache_key, response.data, timeout=60 * 10)

        return response

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        # ✅ Xóa toàn bộ list cache khi có sản phẩm mới
        CacheManager.invalidate_pattern("product:list:")

    def perform_update(self, serializer):
        instance = serializer.save()
        CacheManager.invalidate(CacheKey.PRODUCT_DETAIL.format(slug=instance.slug))
        CacheManager.invalidate_pattern("product:list:")

    def perform_destroy(self, instance):
        CacheManager.invalidate(CacheKey.PRODUCT_DETAIL.format(slug=instance.slug))
        CacheManager.invalidate_pattern("product:list:")
        instance.delete()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    
class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]