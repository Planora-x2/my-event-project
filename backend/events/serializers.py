from rest_framework import serializers
from .models import Venue, Event, Booking
from users.serializers import CustomUserDetailsSerializer

class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    venue_details = VenueSerializer(source='venue', read_only=True)
    
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
