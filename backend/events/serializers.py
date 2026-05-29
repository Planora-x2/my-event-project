from rest_framework import serializers
from .models import Venue, Event, Booking, EventGalleryImage
from users.serializers import CustomUserDetailsSerializer

class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = '__all__'

class EventGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventGalleryImage
        fields = ['id', 'image', 'caption', 'created_at']

class EventSerializer(serializers.ModelSerializer):
    venue_details = VenueSerializer(source='venue', read_only=True)
    gallery_images = EventGalleryImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ('client',)

class BookingSerializer(serializers.ModelSerializer):
    event_details = EventSerializer(source='event', read_only=True)
    user_details = CustomUserDetailsSerializer(source='user', read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'status')
