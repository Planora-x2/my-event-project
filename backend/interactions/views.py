from django.db import models
from rest_framework import viewsets, permissions
from .models import Comment, ChatMessage
from .serializers import CommentSerializer, ChatMessageSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Comment.objects.all().order_by('-created_at')
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ChatMessage.objects.filter(
            models.Q(sender=self.request.user) | models.Q(receiver=self.request.user)
        ).order_by('timestamp')
        
        room = self.request.query_params.get('room')
        if room:
            queryset = queryset.filter(room_group_name=room)
            
        return queryset

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        
        # Broadcast to WebSocket room
        if message.room_group_name:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                message.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message.message,
                    'sender_name': message.sender.username,
                    'timestamp': message.timestamp.isoformat()
                }
            )
