import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create or update admin user
username = 'admin'
email = 'admin@eternallyyours.com'
password = 'adminpassword123'

user, created = User.objects.get_or_create(username=username, defaults={'email': email})
user.set_password(password)
user.role = 'ADMIN'
user.is_staff = True
user.is_superuser = True
user.save()

if created:
    print(f"Successfully created new admin account: {username}")
else:
    print(f"Successfully updated existing admin account: {username}")
