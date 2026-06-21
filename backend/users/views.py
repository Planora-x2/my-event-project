from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework import viewsets, permissions
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.jwt_auth import set_jwt_cookies
from django.contrib.auth import get_user_model
from .serializers import CustomUserDetailsSerializer, SubscriptionSerializer
from .models import Subscription
from interactions.models import Notification

User = get_user_model()

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:4200/"
    client_class = OAuth2Client

class CustomRegisterView(RegisterView):
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if hasattr(self, 'access_token') and hasattr(self, 'refresh_token'):
            set_jwt_cookies(response, self.access_token, self.refresh_token)
        return response

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = CustomUserDetailsSerializer
    permission_classes = [IsAdminUser]

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Subscription.objects.all().order_by('-created_at')
        return Subscription.objects.filter(client=user)

    def perform_create(self, serializer):
        sub = serializer.save(client=self.request.user)
        # Notify admins
        admins = User.objects.filter(role='ADMIN')
        notifications = []
        for admin in admins:
            notifications.append(Notification(
                recipient=admin,
                message=f"New subscription request from {self.request.user.username}.",
                link="/admin-dashboard"
            ))
        Notification.objects.bulk_create(notifications)

    def perform_update(self, serializer):
        sub = serializer.save()
        if self.request.user.role == 'ADMIN':
            # Notify client
            Notification.objects.create(
                recipient=sub.client,
                message=f"Your subscription status has been updated to {sub.status}.",
                link="/client-dashboard"
            )
