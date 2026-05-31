from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer, ChatSessionSerializer
from .rag_pipeline import generate_response
from .intent_classifier import IntentClassifier

intent_classifier = IntentClassifier()

class ChatAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_key = request.data.get("session_key")
        message = request.data.get("message")

        if not session_key:
            return Response(
                {"error": "session_key là bắt buộc."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not message or not message.strip():
            return Response(
                {"error": "message không được để trống."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session, created = ChatSession.objects.get_or_create(session_key=session_key)

        if request.user.is_authenticated and not session.user:
            session.user = request.user
            session.save()
        intent = intent_classifier.predict(message)
        bot_response, citations = generate_response(session, message, intent=intent)

        return Response({
            "response": bot_response,
            "citations": citations,
            "session_key": session_key,
            "predicted_intent": intent
        }, status=status.HTTP_200_OK)



class ChatHistoryAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        session_key = request.query_params.get("session_key")
        
        if not session_key:
            if request.user.is_authenticated:
                session = ChatSession.objects.filter(user=request.user).first()
                if not session:
                    return Response({"messages": []}, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "session_key là bắt buộc đối với khách vãng lai."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            session = ChatSession.objects.filter(session_key=session_key).first()
            if not session:
                return Response({"messages": []}, status=status.HTTP_200_OK)
            if request.user.is_authenticated and not session.user:
                session.user = request.user
                session.save()

        messages = ChatMessage.objects.filter(session=session).order_by("created_at")
        serializer = ChatMessageSerializer(messages, many=True)
        return Response({
            "messages": serializer.data,
            "session_key": session.session_key
        }, status=status.HTTP_200_OK)


class SuggestedQuestionsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        suggestions = [
            "Cửa hàng có chính sách Thu cũ đổi mới (Bán máy cũ) không?",
            "Làm thế nào để kiểm tra giá thu mua điện thoại cũ?",
            "Chính sách bảo hành và đổi trả tại Retech Market thế nào?",
            "Tôi muốn tìm mua một chiếc iPhone Like New giá tốt.",
            "Cửa hàng có những phương thức thanh toán nào?"
        ]
        return Response({"suggestions": suggestions}, status=status.HTTP_200_OK)
