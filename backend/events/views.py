from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Venue, Event, Booking, EventGalleryImage, Enquiry
from .serializers import VenueSerializer, EventSerializer, BookingSerializer, EventGalleryImageSerializer, EnquirySerializer

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
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=location) |
                Q(venue__name__icontains=location) |
                Q(venue__address__icontains=location)
            )
        
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
        user = self.request.user
        if user.role == 'CLIENT':
            from users.models import Subscription
            try:
                if user.subscription.status != 'APPROVED':
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You must have an approved subscription to create events.")
            except Subscription.DoesNotExist:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You must have an approved subscription to create events.")
        serializer.save(client=user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def track_enquiry(self, request, pk=None):
        event = self.get_object()
        # Keep legacy counter
        event.enquiry_count += 1
        event.save()
        
        # Create detailed Enquiry record
        user = request.user if request.user.is_authenticated else None
        Enquiry.objects.create(event=event, user=user)
        
        return Response({'message': 'Enquiry tracked successfully.', 'enquiry_count': event.enquiry_count})

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_gallery_image(self, request, pk=None):
        event = self.get_object()
        
        # Only the event creator or admin can upload
        if event.client != request.user and request.user.role != 'ADMIN':
            return Response({"error": "Not authorized to upload to this event."}, status=status.HTTP_403_FORBIDDEN)
            
        images = request.FILES.getlist('images')
        if not images and 'image' in request.FILES:
            images = [request.FILES['image']]
            
        if not images:
            return Response({"error": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)
            
        caption = request.data.get('caption', '')
        
        created_images = []
        for img in images:
            gallery_image = EventGalleryImage.objects.create(
                event=event,
                image=img,
                caption=caption
            )
            created_images.append(gallery_image)
        
        serializer = EventGalleryImageSerializer(created_images, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        event = self.get_object()
        stars = request.data.get('stars')
        
        if not stars or not isinstance(stars, int) or not (1 <= stars <= 5):
            return Response({"error": "Please provide a valid star rating between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
            
        from interactions.models import Rating
        rating, created = Rating.objects.update_or_create(
            event=event,
            user=request.user,
            defaults={'stars': stars}
        )
        
        return Response({"message": "Rating submitted successfully.", "stars": stars}, status=status.HTTP_200_OK)

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

class EnquiryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnquirySerializer
    permission_classes = [IsClientOrAdmin]

    def get_queryset(self):
        user = self.request.user
        queryset = Enquiry.objects.all()

        if user.role == 'CLIENT':
            queryset = queryset.filter(event__client=user)
            
        client_id = self.request.query_params.get('client')
        if client_id and user.role == 'ADMIN':
            queryset = queryset.filter(event__client_id=client_id)
            
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
            
        return queryset.order_by('-created_at')
