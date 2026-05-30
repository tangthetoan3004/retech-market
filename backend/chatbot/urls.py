from django.urls import path
from .views import ChatAPIView, ChatHistoryAPIView, SuggestedQuestionsAPIView

urlpatterns = [
    path("chat/", ChatAPIView.as_view(), name="chatbot-chat"),
    path("history/", ChatHistoryAPIView.as_view(), name="chatbot-history"),
    path("suggested-questions/", SuggestedQuestionsAPIView.as_view(), name="chatbot-suggested-questions"),
]
