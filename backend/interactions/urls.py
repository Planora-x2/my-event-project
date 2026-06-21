from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, ChatMessageViewSet, AIChatView, NotificationViewSet, LikedEventsView, SavedEventsView

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'messages', ChatMessageViewSet, basename='chatmessage')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('ai_chat/', AIChatView.as_view(), name='ai_chat'),
    path('likes/', LikedEventsView.as_view(), name='liked_events'),
    path('saves/', SavedEventsView.as_view(), name='saved_events'),
]
