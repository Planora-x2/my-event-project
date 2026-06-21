from rest_framework import serializers
from dj_rest_auth.serializers import UserDetailsSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from .models import Subscription

User = get_user_model()

class CustomUserDetailsSerializer(UserDetailsSerializer):
    subscription = serializers.SerializerMethodField()

    class Meta(UserDetailsSerializer.Meta):
        model = User
        fields = UserDetailsSerializer.Meta.fields + ('profile_picture', 'role', 'theme_color', 'theme_font', 'theme_look', 'background_effect', 'is_dark_mode', 'subscription')
        read_only_fields = ('role',)

    def get_subscription(self, obj):
        if hasattr(obj, 'subscription'):
            return SubscriptionSerializer(obj.subscription).data
        return None

class CustomRegisterSerializer(RegisterSerializer):
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.USER)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['role'] = self.validated_data.get('role', '')
        return data

    def save(self, request):
        user = super().save(request)
        user.role = self.cleaned_data.get('role', User.Role.USER)
        user.save()
        return user

class SubscriptionSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.username', read_only=True)

    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ('client', 'status', 'created_at', 'updated_at')
