import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()
if user:
    user.role = 'ADMIN'
    user.save()
    print(f"Promoted {user.username} to ADMIN")
else:
    print("No users found.")
