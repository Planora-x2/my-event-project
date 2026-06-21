from rest_framework import serializers
from .models import Tour, TourBooking

class TourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tour
        fields = '__all__'

class TourBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourBooking
        fields = '__all__'
