from django.core.cache import cache
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class CacheKey:
    PRODUCT_LIST  = "product:list:{hash}"
    PRODUCT_DETAIL = "product:detail:{slug}"
    CATEGORY_LIST  = "category:list:all"
    BRAND_LIST     = "brand:list:all"
    HOT_PRODUCTS   = "product:hot:{limit}"
    USER_CART      = "cart:user:{user_id}"

    @staticmethod
    def make_product_list_key(filters: dict) -> str:
        canonical = json.dumps(filters, sort_keys=True)
        hash_val  = hashlib.md5(canonical.encode()).hexdigest()[:8]
        return CacheKey.PRODUCT_LIST.format(hash=hash_val)


class CacheManager:
    """
    Wrapper an toàn cho Redis cache.
    Mọi operation đều có try/except — nếu Redis chết, app vẫn chạy bình thường
    bằng cách fallback về DB (graceful degradation).
    """

    @staticmethod
    def get(key: str):
        """Lấy giá trị từ cache. Trả None nếu không có hoặc Redis lỗi."""
        try:
            data = cache.get(key)
            if data is not None:
                logger.debug(f"[CACHE HIT] key={key}")
            else:
                logger.debug(f"[CACHE MISS] key={key}")
            return data
        except Exception as e:
            logger.warning(f"[CACHE GET ERROR] key={key} | {e}")
            return None

    @staticmethod
    def set(key: str, data, timeout: int = 900):
        """Lưu giá trị vào cache. Bỏ qua nếu Redis lỗi."""
        try:
            cache.set(key, data, timeout)
            logger.debug(f"[CACHE SET] key={key}, ttl={timeout}s")
        except Exception as e:
            logger.warning(f"[CACHE SET ERROR] key={key} | {e}")

    @staticmethod
    def get_or_set(key: str, callback, timeout: int = 900):
        """Cache-aside: lấy từ cache, nếu miss thì query DB rồi lưu lại."""
        try:
            data = cache.get(key)
            if data is not None:
                logger.debug(f"[CACHE HIT] key={key}")
                return data
        except Exception as e:
            logger.warning(f"[CACHE GET ERROR] key={key} | {e}")

        logger.debug(f"[CACHE MISS] key={key} — querying DB...")
        data = callback()

        try:
            cache.set(key, data, timeout)
        except Exception as e:
            logger.warning(f"[CACHE SET ERROR] key={key} | {e}")

        return data

    @staticmethod
    def invalidate(key: str):
        """Xóa 1 key. Bỏ qua nếu Redis lỗi."""
        try:
            cache.delete(key)
            logger.info(f"[CACHE INVALIDATED] key={key}")
        except Exception as e:
            logger.warning(f"[CACHE INVALIDATE ERROR] key={key} | {e}")

    @staticmethod
    def invalidate_pattern(pattern: str):
        """
        Xóa nhiều key theo pattern prefix.
        Dùng get_redis_connection() — wraps trong try/except để không crash khi Redis offline.
        """
        try:
            from django_redis import get_redis_connection
            conn = get_redis_connection("default")
            full_pattern = f"*{pattern}*"
            keys = conn.keys(full_pattern)
            if keys:
                conn.delete(*keys)
                logger.info(f"[CACHE BULK INVALIDATED] pattern={full_pattern}, count={len(keys)}")
        except Exception as e:
            logger.warning(f"[CACHE PATTERN INVALIDATE ERROR] pattern={pattern} | {e}")