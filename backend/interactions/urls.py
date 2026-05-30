from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, ChatMessageViewSet, AIChatView

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'messages', ChatMessageViewSet, basename='chatmessage')

urlpatterns = [
    path('', include(router.urls)),
    path('ai_chat/', AIChatView.as_view(), name='ai_chat'),
]
