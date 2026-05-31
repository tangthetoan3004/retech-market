import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from products.models import Product
from .models import WebsiteDocument, ProductEmbedding
from .rag_pipeline import generate_embedding

logger = logging.getLogger(__name__)

def get_gemini_api_key():
    return getattr(settings, "GEMINI_API_KEY", "") or ""

@receiver(post_save, sender=Product)
def handle_product_save(sender, instance, created, **kwargs):
    if not get_gemini_api_key():
        return

    if instance.is_deleted or instance.is_sold:
        ProductEmbedding.objects.filter(product=instance).delete()
        logger.info(f"[Signal] Đã xóa embedding cho sản phẩm đã bán/xóa: {instance.name}")
        return

    product_text = (
        f"Sản phẩm: {instance.name}. "
        f"Thương hiệu: {instance.brand.name if instance.brand else 'Chưa rõ'}. "
        f"Danh mục: {instance.category.name if instance.category else 'Chưa rõ'}. "
        f"Giá bán: {instance.price:,.0f} VNĐ. "
        f"Tình trạng máy: {instance.get_condition_display()}. "
        f"Thông số kỹ thuật: RAM {instance.ram or 'N/A'}, Bộ nhớ trong {instance.storage or 'N/A'}. "
        f"Thời gian bảo hành: {instance.warranty_period} tháng. "
        f"Mô tả sản phẩm: {instance.description or 'Chưa có mô tả'}"
    )

    embedding_obj, _ = ProductEmbedding.objects.get_or_create(product=instance)
    
    try:
        emb = generate_embedding(product_text)
        if emb:
            embedding_obj.embedding = emb
            embedding_obj.save()
            logger.info(f"[Signal] Đã cập nhật embedding thành công cho sản phẩm: {instance.name}")
    except Exception as e:
        logger.error(f"[Signal] Lỗi khi tạo embedding cho sản phẩm {instance.name}: {e}")

@receiver(post_delete, sender=Product)
def handle_product_delete(sender, instance, **kwargs):
    ProductEmbedding.objects.filter(product=instance).delete()
    logger.info(f"[Signal] Đã xóa embedding cho sản phẩm bị xóa cứng: {instance.name}")


@receiver(post_save, sender=WebsiteDocument)
def handle_document_save(sender, instance, created, **kwargs):
    if not get_gemini_api_key():
        return

    if not instance.is_active:
        if instance.embedding:
            WebsiteDocument.objects.filter(pk=instance.pk).update(embedding=None)
            logger.info(f"[Signal] Đã gỡ bỏ embedding của tài liệu ngưng hoạt động: {instance.title}")
        return

    doc_text = f"Tài liệu: {instance.title}. Nội dung: {instance.content}"
    try:
        emb = generate_embedding(doc_text)
        if emb:
            WebsiteDocument.objects.filter(pk=instance.pk).update(embedding=emb)
            logger.info(f"[Signal] Đã cập nhật embedding thành công cho tài liệu: {instance.title}")
    except Exception as e:
        logger.error(f"[Signal] Lỗi khi tạo embedding cho tài liệu {instance.title}: {e}")
