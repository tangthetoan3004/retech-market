from datetime import timedelta

from celery import shared_task
from django.utils.timezone import now

from tradein.models import TradeInTempImage
from tradein.services.tradeinService import TradeInService


@shared_task
def auto_cancel_expired_tradeins():
    """Chạy mỗi giờ bởi Celery Beat."""
    count = TradeInService.auto_cancel_expired()
    return f"Cancelled {count} expired trade-in requests."


@shared_task
def cleanup_orphaned_temp_images():
    """Xoá ảnh tạm > 24h chưa được dùng."""
    cutoff = now() - timedelta(hours=24)
    orphaned = TradeInTempImage.objects.filter(created_at__lt=cutoff, is_used=False)
    for img in orphaned:
        img.image.delete(save=False)
    count = orphaned.count()
    orphaned.delete()
    return f"Cleaned up {count} orphaned temp images."
