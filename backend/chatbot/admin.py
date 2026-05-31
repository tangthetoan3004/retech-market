from django.contrib import admin
from django.contrib import messages
from .models import WebsiteDocument, ProductEmbedding, ChatSession, ChatMessage
from .rag_pipeline import sync_product_embeddings, sync_document_embeddings

@admin.action(description="Đồng bộ hóa Vector Embeddings cho tài liệu này")
def sync_doc_embeddings_action(modeladmin, request, queryset):
    """Action đồng bộ hóa embeddings cho tài liệu được chọn."""
    try:
        updated_count = 0
        from .rag_pipeline import generate_embedding
        for doc in queryset:
            doc_text = f"Tài liệu: {doc.title}. Nội dung: {doc.content}"
            emb = generate_embedding(doc_text)
            if emb:
                doc.embedding = emb
                doc.save()
                updated_count += 1
        modeladmin.message_user(
            request,
            f"Đồng bộ thành công embeddings cho {updated_count} tài liệu.",
            messages.SUCCESS
        )
    except Exception as e:
        modeladmin.message_user(
            request,
            f"Lỗi khi đồng bộ: {e}",
            messages.ERROR
        )

@admin.register(WebsiteDocument)
class WebsiteDocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "url_path", "is_active", "updated_at", "has_embedding"]
    list_filter = ["is_active", "created_at", "updated_at"]
    search_fields = ["title", "content", "url_path"]
    actions = [sync_doc_embeddings_action]

    @admin.display(boolean=True, description="Đã có Embedding")
    def has_embedding(self, obj):
        return obj.embedding is not None


@admin.register(ProductEmbedding)
class ProductEmbeddingAdmin(admin.ModelAdmin):
    list_display = ["product_name", "product_price", "updated_at", "has_embedding"]
    search_fields = ["product__name"]
    raw_id_fields = ["product"]

    @admin.display(description="Tên sản phẩm")
    def product_name(self, obj):
        return obj.product.name

    @admin.display(description="Giá bán")
    def product_price(self, obj):
        return f"{obj.product.price:,.0f}đ"

    @admin.display(boolean=True, description="Đã có Embedding")
    def has_embedding(self, obj):
        return obj.embedding is not None


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ["sender", "message", "citations", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ["session_key", "user_username", "message_count", "updated_at"]
    list_filter = ["created_at", "updated_at"]
    search_fields = ["session_key", "user__username"]
    inlines = [ChatMessageInline]
    readonly_fields = ["session_key", "user", "created_at", "updated_at"]

    @admin.display(description="Người dùng")
    def user_username(self, obj):
        return obj.user.username if obj.user else "Khách vãng lai"

    @admin.display(description="Số tin nhắn")
    def message_count(self, obj):
        return obj.messages.count()


# Thêm chức năng đồng bộ hóa toàn bộ embeddings vào Dashboard Admin
@admin.action(description="Đồng bộ hóa toàn bộ dữ liệu (Sản phẩm & Tài liệu) lên Vector DB")
def sync_all_data_action(modeladmin, request, queryset):
    pass
