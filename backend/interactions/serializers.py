from rest_framework import serializers
from .models import Comment, ChatMessage, Notification

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('user',)

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ('sender',)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('recipient', 'message', 'link', 'created_at')
