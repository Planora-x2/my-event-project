from rest_framework import serializers
from .models import Venue, Event, Booking, EventGalleryImage, Enquiry, WeddingCard
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
    client_details = CustomUserDetailsSerializer(source='client', read_only=True)
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    current_user_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ('client',)

    def get_average_rating(self, obj):
        from interactions.models import Rating
        ratings = obj.ratings.all()
        if ratings:
            return sum([r.stars for r in ratings]) / len(ratings)
        return 0
        
    def get_rating_count(self, obj):
        return obj.ratings.count()
        
    def get_current_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            rating = obj.ratings.filter(user=request.user).first()
            if rating:
                return rating.stars
        return 0

class BookingSerializer(serializers.ModelSerializer):
    event_details = EventSerializer(source='event', read_only=True)
    user_details = CustomUserDetailsSerializer(source='user', read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'status')

class EnquirySerializer(serializers.ModelSerializer):
    event_details = EventSerializer(source='event', read_only=True)
    user_details = CustomUserDetailsSerializer(source='user', read_only=True)

    class Meta:
        model = Enquiry
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class WeddingCardSerializer(serializers.ModelSerializer):
    venue_details = VenueSerializer(source='venue', read_only=True)
    user_details = CustomUserDetailsSerializer(source='user', read_only=True)

    class Meta:
        model = WeddingCard
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
