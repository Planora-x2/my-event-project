from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, EventViewSet, BookingViewSet, EnquiryViewSet, WeddingCardViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet)
router.register(r'events', EventViewSet)
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'enquiries', EnquiryViewSet, basename='enquiry')
router.register(r'wedding-cards', WeddingCardViewSet, basename='weddingcard')

urlpatterns = [
    path('', include(router.urls)),
]
