from rest_framework import serializers
from .models import WebsiteDocument, ChatSession, ChatMessage

class WebsiteDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteDocument
        fields = ["id", "title", "content", "url_path", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "sender", "message", "citations", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ChatSession
        fields = ["id", "session_key", "user", "user_username", "messages", "created_at", "updated_at"]
        read_only_fields = ["id", "session_key", "created_at", "updated_at"]
