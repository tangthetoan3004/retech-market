import logging
from celery import shared_task
from .rag_pipeline import sync_product_embeddings, sync_document_embeddings

logger = logging.getLogger(__name__)

@shared_task(name="chatbot.tasks.sync_chatbot_embeddings")
def sync_chatbot_embeddings():
    logger.info("Bắt đầu đồng bộ hóa embeddings cho Chatbot...")
    try:
        updated_docs = sync_document_embeddings()
        updated_prods = sync_product_embeddings()
        logger.info(
            f"Đồng bộ thành công! Đã cập nhật {updated_docs} tài liệu "
            f"và {updated_prods} sản phẩm."
        )
        return {
            "status": "success",
            "updated_documents": updated_docs,
            "updated_products": updated_prods
        }
    except Exception as e:
        logger.error(f"Lỗi trong quá trình đồng bộ embeddings định kỳ: {e}")
        return {
            "status": "failed",
            "error": str(e)
        }
