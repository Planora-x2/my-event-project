from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Tour, TourBooking
from .serializers import TourSerializer, TourBookingSerializer

class TourViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tour.objects.all()
    serializer_class = TourSerializer
    permission_classes = [AllowAny]

class TourBookingViewSet(viewsets.ModelViewSet):
    queryset = TourBooking.objects.all()
    serializer_class = TourBookingSerializer
    permission_classes = [AllowAny]
