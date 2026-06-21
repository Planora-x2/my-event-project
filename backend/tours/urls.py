from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TourViewSet, TourBookingViewSet

router = DefaultRouter()
router.register(r'tours', TourViewSet, basename='tour')
router.register(r'bookings', TourBookingViewSet, basename='tour-booking')

urlpatterns = [
    path('', include(router.urls)),
]
