import requests
import json
import logging
import numpy as np
from django.conf import settings
from django.db.models import Q
from products.models import Product
from .models import WebsiteDocument, ProductEmbedding, ChatMessage

logger = logging.getLogger(__name__)

def get_gemini_api_key():
    return getattr(settings, "GEMINI_API_KEY", "") or ""

def generate_embedding(text):
    api_key = get_gemini_api_key()
    if not api_key:
        logger.warning("GEMINI_API_KEY chưa được cấu hình. Bỏ qua sinh embedding.")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "model": "models/gemini-embedding-001",

        "content": {
            "parts": [{"text": text}]
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        embedding = data.get("embedding", {}).get("values", [])
        return embedding
    except Exception as e:
        logger.error(f"Lỗi khi gọi Gemini Embedding API: {e}")
        return None

def chunk_text(text, chunk_size=500, overlap=100):
    if not text:
        return []
    
    separators = ["\n\n", "\n", " ", ""]
    chunks = []
    
    def split_recursive(text_to_split, current_level=0):
        if len(text_to_split) <= chunk_size:
            return [text_to_split]
            
        if current_level >= len(separators):
            return [text_to_split[i:i+chunk_size] for i in range(0, len(text_to_split), chunk_size - overlap)]
            
        separator = separators[current_level]
        splits = text_to_split.split(separator) if separator else list(text_to_split)
        
        current_chunks = []
        current_chunk = ""
        
        for part in splits:
            joiner = separator if current_chunk else ""
            candidate = current_chunk + joiner + part
            
            if len(candidate) <= chunk_size:
                current_chunk = candidate
            else:
                if current_chunk:
                    current_chunks.append(current_chunk)
                if len(part) > chunk_size:
                    current_chunks.extend(split_recursive(part, current_level + 1))
                    current_chunk = ""
                else:
                    current_chunk = part
                    
        if current_chunk:
            current_chunks.append(current_chunk)
            
        final_chunks = []
        for i, chk in enumerate(current_chunks):
            if i == 0:
                final_chunks.append(chk)
            else:
                prev_chunk = current_chunks[i-1]
                overlap_text = prev_chunk[-overlap:] if len(prev_chunk) >= overlap else prev_chunk
                final_chunks.append(overlap_text + " " + chk)
                
        return final_chunks

    return split_recursive(text, 0)

def cosine_similarity(v1, v2):
    if not v1 or not v2:
        return 0.0
    arr1 = np.array(v1, dtype=np.float32)
    arr2 = np.array(v2, dtype=np.float32)
    dot_prod = np.dot(arr1, arr2)
    norm1 = np.linalg.norm(arr1)
    norm2 = np.linalg.norm(arr2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot_prod / (norm1 * norm2))

def sync_product_embeddings():
    products = Product.objects.filter(is_deleted=False, is_sold=False)
    updated_count = 0
    
    for product in products:
        embedding_obj, created = ProductEmbedding.objects.get_or_create(product=product)
        
        if created or not embedding_obj.embedding or embedding_obj.updated_at < product.updated_at:
            product_text = (
                f"Sản phẩm: {product.name}. "
                f"Thương hiệu: {product.brand.name if product.brand else 'Chưa rõ'}. "
                f"Danh mục: {product.category.name if product.category else 'Chưa rõ'}. "
                f"Giá bán: {product.price:,.0f} VNĐ. "
                f"Tình trạng máy: {product.get_condition_display()}. "
                f"Thông số kỹ thuật: RAM {product.ram or 'N/A'}, Bộ nhớ trong {product.storage or 'N/A'}. "
                f"Thời gian bảo hành: {product.warranty_period} tháng. "
                f"Mô tả sản phẩm: {product.description or 'Chưa có mô tả'}"
            )
            
            emb = generate_embedding(product_text)
            if emb:
                embedding_obj.embedding = emb
                embedding_obj.save()
                updated_count += 1
                
    return updated_count

def sync_document_embeddings():
    docs = WebsiteDocument.objects.filter(is_active=True)
    updated_count = 0
    
    for doc in docs:
        if not doc.embedding:
            doc_text = f"Tài liệu: {doc.title}. Nội dung: {doc.content}"
            emb = generate_embedding(doc_text)
            if emb:
                doc.embedding = emb
                doc.save()
                updated_count += 1
                
    return updated_count

def retrieve_context(query, top_k=5):
    query_emb = generate_embedding(query)
    results = []

    semantic_candidates = []
    if query_emb:
        docs = WebsiteDocument.objects.filter(is_active=True).exclude(embedding__isnull=True)
        for doc in docs:
            sim = cosine_similarity(query_emb, doc.embedding)
            if sim > 0.3:  
                semantic_candidates.append({
                    "type": "document",
                    "id": doc.id,
                    "title": doc.title,
                    "content": doc.content,
                    "url_path": doc.url_path or "/support",
                    "score": sim
                })

        prods = ProductEmbedding.objects.filter(product__is_deleted=False, product__is_sold=False).exclude(embedding__isnull=True)
        for prod_emb in prods:
            sim = cosine_similarity(query_emb, prod_emb.embedding)
            if sim > 0.3:
                prod = prod_emb.product
                semantic_candidates.append({
                    "type": "product",
                    "id": prod.id,
                    "title": prod.name,
                    "content": (
                        f"Sản phẩm {prod.name} thuộc danh mục {prod.category.name if prod.category else 'N/A'}, "
                        f"thương hiệu {prod.brand.name if prod.brand else 'N/A'}. "
                        f"Giá: {prod.price:,.0f}đ. Tình trạng: {prod.get_condition_display()}. "
                        f"RAM: {prod.ram or 'N/A'}, Bộ nhớ: {prod.storage or 'N/A'}, Bảo hành: {prod.warranty_period} tháng. "
                        f"Mô tả: {prod.description[:200] if prod.description else ''}"
                    ),
                    "url_path": f"/products/{prod.slug}",
                    "score": sim
                })

    keyword_candidates = []
    words = [w for w in query.split() if len(w) > 1]
    if words:
        q_docs = Q()
        for w in words:
            q_docs |= Q(title__icontains=w) | Q(content__icontains=w)
        matched_docs = WebsiteDocument.objects.filter(Q(is_active=True) & q_docs)
        for doc in matched_docs:
            match_count = sum(1 for w in words if w.lower() in doc.title.lower() or w.lower() in doc.content.lower())
            score = 0.5 * (match_count / len(words))
            keyword_candidates.append({
                "type": "document",
                "id": doc.id,
                "title": doc.title,
                "content": doc.content,
                "url_path": doc.url_path or "/support",
                "score": score
            })

        q_prods = Q()
        for w in words:
            q_prods |= Q(name__icontains=w) | Q(description__icontains=w)
        matched_prods = Product.objects.filter(Q(is_deleted=False) & Q(is_sold=False) & q_prods)
        for prod in matched_prods:
            match_count = sum(1 for w in words if w.lower() in prod.name.lower() or (prod.description and w.lower() in prod.description.lower()))
            score = 0.5 * (match_count / len(words))
            keyword_candidates.append({
                "type": "product",
                "id": prod.id,
                "title": prod.name,
                "content": (
                    f"Sản phẩm {prod.name}. Giá: {prod.price:,.0f}đ. "
                    f"RAM: {prod.ram or 'N/A'}, Bộ nhớ: {prod.storage or 'N/A'}"
                ),
                "url_path": f"/products/{prod.slug}",
                "score": score
            })

    fusion_dict = {}
    for c in semantic_candidates:
        key = (c["type"], c["id"])
        fusion_dict[key] = c
        fusion_dict[key]["score"] = c["score"] * 0.7

    for c in keyword_candidates:
        key = (c["type"], c["id"])
        if key in fusion_dict:
            fusion_dict[key]["score"] += c["score"] * 0.3
        else:
            fusion_dict[key] = c
            fusion_dict[key]["score"] = c["score"] * 0.3

    sorted_candidates = sorted(fusion_dict.values(), key=lambda x: x["score"], reverse=True)
    return sorted_candidates[:top_k]

def generate_response(session, user_message, intent=None):
    api_key = get_gemini_api_key()
    ChatMessage.objects.create(
        session=session,
        sender="user",
        message=user_message
    )

    if intent == "ban_may_cu":
        bot_response = (
            "Retech Market hỗ trợ thu mua điện thoại cũ trực tuyến nhanh chóng với mức giá cao và cạnh tranh nhất thị trường. "
            "Bạn có thể tiến hành tự thẩm định và gửi yêu cầu bán máy cũ của mình ngay tại [Form Bán Máy Cũ](/tradeins/form)."
        )
        citations_to_save = [{
            "index": 1,
            "title": "Form Bán Máy Cũ",
            "url_path": "/tradeins/form",
            "type": "document"
        }]
        
        ChatMessage.objects.create(
            session=session,
            sender="bot",
            message=bot_response,
            citations=citations_to_save
        )
        return bot_response, citations_to_save

    contexts = []
    rag_enabled = getattr(settings, "CHATBOT_RAG_ENABLED", True)
    if rag_enabled and intent != "chuyen_phiem":
        contexts = retrieve_context(user_message, top_k=4)
    context_str = ""
    citations_data = []
    
    for i, ctx in enumerate(contexts, 1):
        context_str += f"[{i}] Tiêu đề: {ctx['title']}\nNội dung: {ctx['content']}\n\n"
        citations_data.append({
            "index": i,
            "title": ctx["title"],
            "url_path": ctx["url_path"],
            "type": ctx["type"]
        })

    max_history = getattr(settings, "LOCAL_LLM_MAX_HISTORY", 4)
    history_messages = ChatMessage.objects.filter(session=session).order_by("-created_at")[:max_history]
    history_messages = list(reversed(history_messages))
    
    history_str = ""
    for msg in history_messages:
        role = "Khách hàng" if msg.sender == "user" else "Trợ lý ảo"
        history_str += f"{role}: {msg.message}\n"

    if intent == "chuyen_phiem":
        system_instruction = (
            "Bạn là trợ lý ảo vui vẻ, lịch sự và thân thiện của website Retech Market.\n"
            "Hãy giao tiếp và trò chuyện tự nhiên với khách hàng bằng tiếng Việt.\n"
            "Nếu khách hàng hỏi về sản phẩm, chính sách hoặc thu cũ đổi mới, hãy gợi ý họ đặt câu hỏi rõ hơn để bạn có thể hỗ trợ tra cứu thông tin chính xác nhất.\n"
        )
    else:
        system_instruction = (
            "Bạn là trợ lý ảo tư vấn mua sắm và chính sách thông minh của website Retech Market.\n"
            "Nhiệm vụ của bạn là sử dụng dữ liệu được cung cấp dưới đây để trả lời câu hỏi của khách hàng bằng tiếng Việt một cách thân thiện, lễ phép và trung thực.\n"
            "Quy tắc sống còn:\n"
            "1. KHÔNG được bịa đặt thông tin nằm ngoài tài liệu (đặc biệt là giá bán hoặc tình trạng máy).\n"
            "2. Nếu không tìm thấy thông tin phù hợp trong phần Tài liệu tham khảo, hãy lịch sự thông báo rằng bạn chưa có thông tin này và gợi ý họ liên hệ hotline 1900-8888 để được hỗ trợ.\n"
            "3. Khi đề cập đến một thông tin cụ thể trích xuất từ tài liệu, BẮT BUỘC bạn phải ghi chú nguồn dạng [Nguồn X] (ví dụ: [Nguồn 1], [Nguồn 2]) tương ứng với số thứ tự nguồn được cung cấp.\n"
        )

    prompt = (
        f"{system_instruction}\n"
    )
    if intent != "chuyen_phiem":
        prompt += (
            f"--- Tài liệu tham khảo ---\n"
            f"{context_str or 'Không có tài liệu nào liên quan.'}\n"
            f"---------------------------\n\n"
        )
    prompt += (
        f"--- Lịch sử cuộc hội thoại ---\n"
        f"{history_str}\n"
        f"-------------------------------\n\n"
        f"Khách hàng: {user_message}\n"
        f"Trợ lý ảo Retech:"
    )
    llm_provider = getattr(settings, "LLM_PROVIDER", "gemini").lower()
    local_url = getattr(settings, "LOCAL_LLM_API_URL", "http://localhost:11434/api/generate")
    local_model = getattr(settings, "LOCAL_LLM_MODEL", "llama3")
    local_timeout = getattr(settings, "LOCAL_LLM_TIMEOUT", 30)
    local_num_predict = getattr(settings, "LOCAL_LLM_NUM_PREDICT", 256)

    bot_response = "Xin lỗi, hiện tại tôi đang gặp khó khăn khi kết nối hệ thống. Bạn vui lòng thử lại sau."
    citations_to_save = []
    use_gemini = True

    if llm_provider == "local":
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": local_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": local_num_predict
            }
        }
        try:
            logger.info(f"Đang gọi Local LLM ({local_model}) tại {local_url} (timeout={local_timeout}s, num_predict={local_num_predict})...")
            res = requests.post(local_url, headers=headers, json=payload, timeout=local_timeout)
            res.raise_for_status()
            res_data = res.json()
            response_text = res_data.get("response", "").strip()
            if response_text:
                bot_response = response_text
                use_gemini = False
                if intent != "chuyen_phiem":
                    for cit in citations_data:
                        ref_tag = f"[Nguồn {cit['index']}]"
                        if ref_tag in bot_response:
                            citations_to_save.append(cit)
                logger.info("Gọi Local LLM thành công.")
        except Exception as e:
            logger.warning(f"Lỗi khi kết nối Local LLM: {e}. Tự động chuyển hướng (fallback) sang Gemini API...")
            use_gemini = True

    if use_gemini:
        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ]
            }
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=15)
                res.raise_for_status()
                res_data = res.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    bot_response = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", bot_response)
                    bot_response = bot_response.strip()
                    if intent != "chuyen_phiem":
                        for cit in citations_data:
                            ref_tag = f"[Nguồn {cit['index']}]"
                            if ref_tag in bot_response:
                                citations_to_save.append(cit)
            except Exception as e:
                logger.error(f"Lỗi khi gọi Gemini Generate Content API: {e}")
        else:
            logger.warning("GEMINI_API_KEY chưa được cấu hình. Chatbot trả về phản hồi mặc định.")
            bot_response = "Hệ thống AI hiện chưa được cấu hình API Key. Bạn vui lòng liên hệ Admin để thiết lập."

    ChatMessage.objects.create(
        session=session,
        sender="bot",
        message=bot_response,
        citations=citations_to_save
    )

    return bot_response, citations_to_save

