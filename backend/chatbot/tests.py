import json
import requests
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from .models import WebsiteDocument, ChatSession, ChatMessage, ProductEmbedding
from .rag_pipeline import chunk_text, cosine_similarity, generate_embedding

User = get_user_model()

class RAGPipelineTests(TestCase):
    """
    Test các hàm chức năng trong RAG pipeline.
    """
    def test_chunk_text(self):
        # Test cắt văn bản ngắn
        text = "Xin chào. Tôi là trợ lý ảo tư vấn mua hàng."
        chunks = chunk_text(text, chunk_size=50, overlap=5)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0], text)

        # Test cắt văn bản dài hơn chunk_size
        long_text = "Đây là dòng một.\n\nĐây là dòng hai với nội dung dài hơn để kích hoạt chunking đệ quy.\n\nĐây là dòng ba kết thúc."
        chunks = chunk_text(long_text, chunk_size=40, overlap=5)
        self.assertTrue(len(chunks) > 1)
        # Các chunk không được rỗng
        for chunk in chunks:
            self.assertTrue(len(chunk) > 0)

    def test_cosine_similarity(self):
        # 2 vector trùng nhau
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        self.assertAlmostEqual(cosine_similarity(v1, v2), 1.0)

        # 2 vector vuông góc
        v3 = [0.0, 1.0, 0.0]
        self.assertAlmostEqual(cosine_similarity(v1, v3), 0.0)

        # Vector rỗng/None
        self.assertEqual(cosine_similarity(None, v2), 0.0)
        self.assertEqual(cosine_similarity([], v2), 0.0)

    @patch("requests.post")
    def test_generate_embedding(self, mock_post):
        # Mock API response thành công
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "embedding": {
                "values": [0.1, 0.2, 0.3]
            }
        }
        mock_post.return_value = mock_response

        # Cần gán tạm GEMINI_API_KEY cho test case chạy được
        with self.settings(GEMINI_API_KEY="test_key"):
            emb = generate_embedding("hello")
            self.assertEqual(emb, [0.1, 0.2, 0.3])


class ChatbotAPITests(APITestCase):
    """
    Test các API endpoints của app chatbot.
    """
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword",
            email="testuser@example.com"
        )
        # Tạo sẵn tài liệu mẫu để test retrieval
        self.doc = WebsiteDocument.objects.create(
            title="Chính sách bảo hành",
            content="Tất cả điện thoại Like New được bảo hành 6 tháng phần cứng.",
            url_path="/warranty",
            embedding=[0.1] * 3072
        )

    @patch("chatbot.views.intent_classifier.predict")
    @patch("requests.post")
    def test_chat_api_success(self, mock_post, mock_predict):
        mock_predict.return_value = "chinh_sach"
        # Mock lần 1 (sinh embedding)
        mock_response_embed = MagicMock()
        mock_response_embed.status_code = 200
        mock_response_embed.json.return_value = {
            "embedding": {
                "values": [0.1] * 3072
            }
        }
        
        # Mock lần 2 (sinh chat content)
        mock_response_chat = MagicMock()
        mock_response_chat.status_code = 200
        mock_response_chat.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Chào bạn, tất cả điện thoại cũ được bảo hành 6 tháng. [Nguồn 1]"}]
                    }
                }
            ]
        }
        
        # Thiết lập side_effect để requests.post trả về tuần tự
        mock_post.side_effect = [mock_response_embed, mock_response_chat]

        url = reverse("chatbot-chat")
        data = {
            "session_key": "test_session_123",
            "message": "Chính sách bảo hành điện thoại cũ thế nào?"
        }
        
        # Cần gán GEMINI_API_KEY và LLM_PROVIDER="gemini"
        with self.settings(LLM_PROVIDER="gemini", GEMINI_API_KEY="test_key"):
            response = self.client.post(url, data, format="json")
            
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertIn("citations", response.data)
        self.assertEqual(response.data["session_key"], "test_session_123")

        # Kiểm tra session và message được lưu trong DB (1 user message, 1 bot message)
        session = ChatSession.objects.get(session_key="test_session_123")
        self.assertEqual(ChatMessage.objects.filter(session=session).count(), 2)
        
        user_msg = ChatMessage.objects.filter(session=session, sender="user").first()
        self.assertEqual(user_msg.message, data["message"])
        
        bot_msg = ChatMessage.objects.filter(session=session, sender="bot").first()
        self.assertIn("Chào bạn, tất cả điện thoại cũ được bảo hành 6 tháng.", bot_msg.message)
        self.assertEqual(len(bot_msg.citations), 1)
        self.assertEqual(bot_msg.citations[0]["title"], self.doc.title)


    @patch("chatbot.views.intent_classifier.predict")
    @patch("requests.post")
    def test_chat_local_llm_success(self, mock_post, mock_predict):
        mock_predict.return_value = "chinh_sach"
        
        # Mock 1: embedding
        mock_response_embed = MagicMock()
        mock_response_embed.status_code = 200
        mock_response_embed.json.return_value = {
            "embedding": {
                "values": [0.1] * 3072
            }
        }
        
        # Mock 2: local LLM response
        mock_response_local = MagicMock()
        mock_response_local.status_code = 200
        mock_response_local.json.return_value = {
            "response": "Mô phỏng phản hồi từ Llama-3 chạy local. [Nguồn 1]"
        }
        
        mock_post.side_effect = [mock_response_embed, mock_response_local]

        url = reverse("chatbot-chat")
        data = {
            "session_key": "test_local_123",
            "message": "Chính sách bảo hành thế nào?"
        }
        
        # Cấu hình sử dụng local LLM
        with self.settings(LLM_PROVIDER="local", GEMINI_API_KEY="test_key"):
            response = self.client.post(url, data, format="json")
            
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["response"], "Mô phỏng phản hồi từ Llama-3 chạy local. [Nguồn 1]")
        self.assertEqual(len(response.data["citations"]), 1)
        self.assertEqual(response.data["citations"][0]["title"], self.doc.title)

    @patch("chatbot.views.intent_classifier.predict")
    @patch("requests.post")
    def test_chat_local_llm_fallback(self, mock_post, mock_predict):
        mock_predict.return_value = "chinh_sach"
        
        # Mock 1: embedding
        mock_response_embed = MagicMock()
        mock_response_embed.status_code = 200
        mock_response_embed.json.return_value = {
            "embedding": {
                "values": [0.1] * 3072
            }
        }
        
        # Mock 3: Gemini fallback response
        mock_response_gemini = MagicMock()
        mock_response_gemini.status_code = 200
        mock_response_gemini.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Phản hồi từ Gemini dự phòng do Local lỗi. [Nguồn 1]"}]
                    }
                }
            ]
        }
        
        # Mock 2 sẽ quăng ConnectionError, 1 & 3 trả về kết quả
        mock_post.side_effect = [
            mock_response_embed, 
            requests.exceptions.ConnectionError("Connection refused"), 
            mock_response_gemini
        ]

        url = reverse("chatbot-chat")
        data = {
            "session_key": "test_fallback_123",
            "message": "Chính sách bảo hành thế nào?"
        }
        
        # Cấu hình dùng local nhưng bị lỗi kết nối
        with self.settings(LLM_PROVIDER="local", GEMINI_API_KEY="test_key"):
            response = self.client.post(url, data, format="json")
            
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("response", response.data)
        self.assertEqual(response.data["response"], "Phản hồi từ Gemini dự phòng do Local lỗi. [Nguồn 1]")
        self.assertEqual(len(response.data["citations"]), 1)
        self.assertEqual(response.data["citations"][0]["title"], self.doc.title)


    def test_chat_api_missing_parameters(self):
        url = reverse("chatbot-chat")
        
        # Thiếu message
        response = self.client.post(url, {"session_key": "test"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Thiếu session_key
        response = self.client.post(url, {"message": "hello"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chat_history_api(self):
        # Tạo session và tin nhắn mẫu
        session = ChatSession.objects.create(session_key="test_session_123", user=self.user)
        ChatMessage.objects.create(session=session, sender="user", message="Hello bot")
        ChatMessage.objects.create(session=session, sender="bot", message="Chào testuser!")

        url = reverse("chatbot-history")
        
        # Test lấy history bằng session_key
        response = self.client.get(url, {"session_key": "test_session_123"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["messages"]), 2)
        self.assertEqual(response.data["messages"][0]["message"], "Hello bot")
        self.assertEqual(response.data["messages"][1]["message"], "Chào testuser!")

    def test_suggested_questions_api(self):
        url = reverse("chatbot-suggested-questions")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("suggestions", response.data)
        self.assertTrue(len(response.data["suggestions"]) > 0)


class ChatbotSignalTests(TestCase):
    """
    Test các tín hiệu Django signals tự động đồng bộ hóa embeddings.
    """
    def setUp(self):
        self.patcher_settings = self.settings(GEMINI_API_KEY="test_key")
        self.patcher_settings.enable()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_user(
            username="seller_user",
            password="password",
            email="seller@example.com"
        )

    def tearDown(self):
        self.patcher_settings.disable()

    @patch("requests.post")
    def test_product_post_save_signal(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "embedding": {
                "values": [0.5, 0.6, 0.7]
            }
        }
        mock_post.return_value = mock_response

        # Tạo product mới
        from products.models import Product
        
        product = Product.objects.create(
            name="iPhone 15 Pro",
            price=30000000,
            condition="NEW",
            warranty_period=12,
            is_deleted=False,
            is_sold=False,
            seller=self.user
        )

        # Kiểm tra ProductEmbedding được tạo tự động
        self.assertTrue(ProductEmbedding.objects.filter(product=product).exists())
        emb_obj = ProductEmbedding.objects.get(product=product)
        self.assertEqual(emb_obj.embedding, [0.5, 0.6, 0.7])

        # Đánh dấu sản phẩm đã bán -> Embedding phải tự động bị xóa
        product.is_sold = True
        product.save()
        self.assertFalse(ProductEmbedding.objects.filter(product=product).exists())

