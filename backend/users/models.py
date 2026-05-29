from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        CLIENT = "CLIENT", "Client"
        USER = "USER", "User"

    class ThemeColor(models.TextChoices):
        ROSE = "rose", "Rose"
        MINT = "mint", "Mint"
        LAVENDER = "lavender", "Lavender"
        GOLD = "gold", "Gold"

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.USER)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    theme_color = models.CharField(max_length=50, choices=ThemeColor.choices, default=ThemeColor.ROSE)
    is_dark_mode = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"
