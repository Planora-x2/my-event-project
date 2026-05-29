from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework import viewsets, permissions
from django.contrib.auth import get_user_model
from .serializers import CustomUserDetailsSerializer

User = get_user_model()

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:4200/"
    client_class = OAuth2Client

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = CustomUserDetailsSerializer
    permission_classes = [IsAdminUser]
