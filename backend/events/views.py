from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Venue, Event, Booking, EventGalleryImage
from .serializers import VenueSerializer, EventSerializer, BookingSerializer, EventGalleryImageSerializer

class IsClientOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['CLIENT', 'ADMIN']

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    permission_classes = [IsClientOrAdmin]

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsClientOrAdmin]

    def get_queryset(self):
        queryset = Event.objects.all()
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(venue__address__icontains=location)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        client_id = self.request.query_params.get('client')
        if client_id:
            if client_id == 'me':
                queryset = queryset.filter(client=self.request.user)
            else:
                queryset = queryset.filter(client_id=client_id)
                
        return queryset

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_gallery_image(self, request, pk=None):
        event = self.get_object()
        
        # Only the event creator or admin can upload
        if event.client != request.user and request.user.role != 'ADMIN':
            return Response({"error": "Not authorized to upload to this event."}, status=status.HTTP_403_FORBIDDEN)
            
        if 'image' not in request.FILES:
            return Response({"error": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)
            
        image = request.FILES['image']
        caption = request.data.get('caption', '')
        
        gallery_image = EventGalleryImage.objects.create(
            event=event,
            image=image,
            caption=caption
        )
        
        serializer = EventGalleryImageSerializer(gallery_image)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Booking.objects.all()
        elif user.role == 'CLIENT':
            return Booking.objects.filter(event__client=user)
        return Booking.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
