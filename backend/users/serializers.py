from rest_framework import serializers
from dj_rest_auth.serializers import UserDetailsSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomUserDetailsSerializer(UserDetailsSerializer):
    class Meta(UserDetailsSerializer.Meta):
        model = User
        fields = UserDetailsSerializer.Meta.fields + ('profile_picture', 'role', 'theme_color', 'theme_font', 'theme_look', 'background_effect', 'is_dark_mode')
        read_only_fields = ('role',)

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
