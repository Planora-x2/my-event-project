from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Comment, ChatMessage, Notification, LikedEvent, SavedEvent
from events.models import Event, Venue
from .serializers import CommentSerializer, ChatMessageSerializer, NotificationSerializer
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
        comment = serializer.save(user=self.request.user)
        # Notify event organizer
        if comment.event.client != self.request.user:
            Notification.objects.create(
                recipient=comment.event.client,
                message=f"{self.request.user.username} commented on your event: {comment.event.title}",
                link=f"/event/{comment.event.id}"
            )

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ChatMessage.objects.all().order_by('timestamp')
        room = self.request.query_params.get('room')

        if user.role == 'ADMIN' and room and room.startswith('support_'):
            return queryset.filter(room_group_name=room)

        queryset = queryset.filter(
            models.Q(sender=user) | models.Q(receiver=user)
        )
        if room:
            queryset = queryset.filter(room_group_name=room)
            
        return queryset

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        
        # Determine notifications
        if message.room_group_name and message.room_group_name.startswith('support_'):
            if self.request.user.role == 'CLIENT':
                # Notify admins
                from django.contrib.auth import get_user_model
                User = get_user_model()
                admins = User.objects.filter(role='ADMIN')
                for admin in admins:
                    Notification.objects.create(
                        recipient=admin,
                        message=f"New support message from {self.request.user.username}.",
                        link="/support"
                    )
            elif self.request.user.role == 'ADMIN':
                # Try to extract client ID from room name: support_{client_id}
                try:
                    client_id = int(message.room_group_name.split('_')[1])
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    client = User.objects.get(id=client_id)
                    Notification.objects.create(
                        recipient=client,
                        message=f"Admin replied to your support request.",
                        link="/support"
                    )
                except Exception:
                    pass
        else:
            # Normal chat notification
            if message.receiver and message.receiver != self.request.user:
                Notification.objects.create(
                    recipient=message.receiver,
                    message=f"New message from {self.request.user.username}.",
                    link=f"/chat"
                )

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

class AIChatView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.db.models import Q
        message = request.data.get('message', '').lower()
        
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about', 'show', 'me', 'find', 'looking', 'some', 'any', 'can', 'you', 'help', 'i', 'need', 'want', 'details', 'vendor', 'vendors', 'price', 'cost'}
        
        # Keep letters and numbers only for words
        import re
        words_raw = re.findall(r'\b\w+\b', message)
        words = [w for w in words_raw if w not in stop_words and len(w) > 2]
        
        images = []
        vendors = []
        response = ""
        
        if not words or ('hello' in message or 'hi' in message.split()):
            response = "Hello there! I'm your Eternally Yours AI Assistant. How can I help you find vendors or plan your perfect day?"
            return Response({'response': response, 'images': images, 'vendors': vendors}, status=status.HTTP_200_OK)

        if 'book' in words or 'ticket' in words:
            response = "To book a service, navigate to its detail page and click 'Book Tickets'. You'll need to be logged in!"
            return Response({'response': response, 'images': images, 'vendors': vendors}, status=status.HTTP_200_OK)

        # Dynamic Search
        query = Q()
        for word in words:
            query |= Q(title__icontains=word) | Q(description__icontains=word) | Q(category__icontains=word)
            query |= Q(venue__name__icontains=word) | Q(venue__address__icontains=word)
            
        # If no words matched for Q, fallback to all (shouldn't happen because of above check, but safe)
        if query:
            events = Event.objects.filter(query).distinct()
        else:
            events = Event.objects.none()
            
        if not events.exists() and 'price' in message:
            events = Event.objects.all().order_by('price')
            
        if events.exists():
            results = events[:3]
            titles = ", ".join([e.title for e in results])
            response = f"I found some great options for you: {titles}."
            
            for e in results:
                vendor_data = {
                    "id": e.id,
                    "title": e.title,
                    "category": e.get_category_display(),
                    "price": str(e.price)
                }
                if e.image:
                    img_url = request.build_absolute_uri(e.image.url)
                    vendor_data["image"] = img_url
                    images.append(img_url)
                
                if e.venue and e.venue.address:
                    vendor_data["address"] = f"{e.venue.name}, {e.venue.address}"
                    map_query = f"{e.venue.name} {e.venue.address}".replace(' ', '+')
                    vendor_data["mapUrl"] = f"https://maps.google.com/?q={map_query}"
                
                vendors.append(vendor_data)
                
            response += " Here are the details and locations:"
        else:
            response = "I couldn't find any specific vendors matching your request. Try searching with different keywords like 'photography', 'beach', or 'catering'."

        return Response({'response': response, 'images': images, 'vendors': vendors}, status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

class LikedEventsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        liked_event_ids = LikedEvent.objects.filter(user=request.user).values_list('event_id', flat=True)
        return Response(list(liked_event_ids))

    def post(self, request):
        event_id = request.data.get('event_id')
        if not event_id:
            return Response({'error': 'event_id is required'}, status=400)
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=404)

        liked, created = LikedEvent.objects.get_or_create(user=request.user, event=event)
        if not created:
            liked.delete()
            return Response({'status': 'unliked', 'event_id': event_id})
        return Response({'status': 'liked', 'event_id': event_id})

class SavedEventsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved_event_ids = SavedEvent.objects.filter(user=request.user).values_list('event_id', flat=True)
        return Response(list(saved_event_ids))

    def post(self, request):
        event_id = request.data.get('event_id')
        if not event_id:
            return Response({'error': 'event_id is required'}, status=400)
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=404)

        saved, created = SavedEvent.objects.get_or_create(user=request.user, event=event)
        if not created:
            saved.delete()
            return Response({'status': 'unsaved', 'event_id': event_id})
        return Response({'status': 'saved', 'event_id': event_id})
