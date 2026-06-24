"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.views import GoogleLogin, CustomRegisterView, AdminUserViewSet, SubscriptionViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')

users_router = DefaultRouter()
users_router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('admin/', admin.site.urls),
    # dj-rest-auth for user profile, registration, logout, login (sets HttpOnly cookies)
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', CustomRegisterView.as_view(), name='custom_rest_register'),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('api/events/', include('events.urls')),
    path('api/interactions/', include('interactions.urls')),
    path('api/users/', include(users_router.urls)),
    path('api/admin/', include(admin_router.urls)),
    path('api/tours/', include('tours.urls')),
    path('api/planning/', include('planning.urls')),
]

# Media files:
# - In production: Nginx serves /media/ directly from MEDIA_ROOT (see nginx.conf)
# - In development: Django serves them here (DEBUG=True uses runserver)
# - Always registered so Django can serve as fallback if needed
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
