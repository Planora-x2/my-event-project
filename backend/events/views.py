from rest_framework import viewsets, permissions
from .models import Venue, Event, Booking
from .serializers import VenueSerializer, EventSerializer, BookingSerializer

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
        
        client_id = self.request.query_params.get('client')
        if client_id:
            if client_id == 'me':
                queryset = queryset.filter(client=self.request.user)
            else:
                queryset = queryset.filter(client_id=client_id)
                
        return queryset

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

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
