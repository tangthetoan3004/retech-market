from django.core.cache import cache
import hashlib
import json
import logging

logger = logging.getLogger(__name__)
class CacheKey:
    PRODUCT_LIST      = "product:list:{hash}"
    PRODUCT_DETAIL    = "product:detail:{slug}"
    CATEGORY_LIST     = "category:list:all"
    HOT_PRODUCTS      = "product:hot:{limit}"
    USER_CART         = "cart:user:{user_id}"
    
    @staticmethod
    def make_product_list_key(filters: dict) -> str:
        canonical = json.dumps(filters, sort_keys=True)
        hash_val  = hashlib.md5(canonical.encode()).hexdigest()[:8]
        return CacheKey.PRODUCT_LIST.format(hash=hash_val)
class CacheManager:
    @staticmethod
    def get_or_set(key: str, callback, timeout: int = 900):
        data = cache.get(key)
        if data is not None:
            logger.debug(f"[CACHE HIT] key={key}")
            return data
        
        logger.debug(f"[CACHE MISS] key={key} — querying DB...")
        data = callback()
        cache.set(key, data, timeout)
        return data

    @staticmethod
    def get(key: str):
        data = cache.get(key)
        if data is not None:
            logger.debug(f"[CACHE HIT] key={key}")
        else:
            logger.debug(f"[CACHE MISS] key={key}")
        return data

    @staticmethod
    def set(key: str, data, timeout: int = 900):
        cache.set(key, data, timeout)
        logger.debug(f"[CACHE SET] key={key}, ttl={timeout}s")

    @staticmethod
    def invalidate(key: str):
        cache.delete(key)
        logger.info(f"[CACHE INVALIDATED] key={key}")

    @staticmethod
    def invalidate_pattern(pattern: str):
        from django_redis import get_redis_connection
        conn = get_redis_connection("default")
        full_pattern = f"retech:{pattern}*"
        keys = conn.keys(full_pattern)
        if keys:
            conn.delete(*keys)
            logger.info(f"[CACHE BULK INVALIDATED] pattern={full_pattern}, count={len(keys)}")