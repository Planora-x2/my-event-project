from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Comment, ChatMessage
from events.models import Event, Venue
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

class AIChatView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').lower()
        
        images = []
        # Simple mock AI logic that pulls from database
        if 'venue' in message or 'location' in message:
            venues = Venue.objects.all()
            if venues.exists():
                venue_names = ", ".join([v.name for v in venues[:3]])
                response = f"We have several breathtaking venues available, such as {venue_names}! You can explore more in the 'Planner Portal' or search for specific ones on the homepage."
                images = [request.build_absolute_uri(v.image.url) for v in venues[:3] if v.image]
            else:
                response = "We currently don't have any venues listed, but please check back later!"
        
        elif 'price' in message or 'cost' in message:
            events = Event.objects.all().order_by('price')
            if events.exists():
                cheapest = events.first()
                response = f"Event prices vary based on the service and venue. Our options start at ${cheapest.price} for '{cheapest.title}'. You can see exact pricing on each event's details page!"
                if cheapest.image:
                    images = [request.build_absolute_uri(cheapest.image.url)]
            else:
                response = "Pricing depends on the specific event. Please browse our homepage to see what's available!"
                
        elif 'photography' in message or 'photo' in message:
            photo_events = Event.objects.filter(category='PHOTOGRAPHY')
            if photo_events.exists():
                titles = ", ".join([e.title for e in photo_events[:3]])
                response = f"Our photography packages are top-tier! We offer options like: {titles}. Filter by 'Photography' on the homepage to see them."
                images = [request.build_absolute_uri(e.image.url) for e in photo_events[:3] if e.image]
            else:
                response = "We don't have specific photography packages at the moment, but you can check with event organizers directly!"
                
        elif 'book' in message or 'ticket' in message:
            response = "To book an event, simply navigate to the event's detail page, select the number of tickets you need, and click 'Book Tickets'. You'll need to be logged in first!"
        elif 'hello' in message or 'hi ' in message or message == 'hi':
            response = "Hello there! I'm your Eternally Yours AI Assistant. How can I help you plan your perfect day?"
        else:
            response = "That's a great question! I'm still learning, but you can explore our 'Featured Celebrations' or contact an event organizer directly through the live chat feature on any event page."
            
        return Response({'response': response, 'images': images}, status=status.HTTP_200_OK)
