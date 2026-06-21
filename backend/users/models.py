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
        OCEAN = "ocean", "Ocean"
        RUBY = "ruby", "Ruby"
        EMERALD = "emerald", "Emerald"
        SAPPHIRE = "sapphire", "Sapphire"

    class ThemeFont(models.TextChoices):
        CLASSIC = "classic", "Classic (Serif)"
        MODERN = "modern", "Modern (Sans-Serif)"
        PLAYFUL = "playful", "Playful (Handwriting)"

    class ThemeLook(models.TextChoices):
        ELEGANT = "elegant", "Elegant"
        MINIMAL = "minimal", "Minimal"
        BOLD = "bold", "Bold"

    class BackgroundEffect(models.TextChoices):
        NONE = "none", "None"
        FLOWERS = "flowers", "Flowers"
        RAIN = "rain", "Rain"
        SNOW = "snow", "Snow"
        CONFETTI = "confetti", "Confetti"
        PARTICLES = "particles", "Particles"

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.USER)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    theme_color = models.CharField(max_length=50, choices=ThemeColor.choices, default=ThemeColor.ROSE)
    theme_font = models.CharField(max_length=50, choices=ThemeFont.choices, default=ThemeFont.CLASSIC)
    theme_look = models.CharField(max_length=50, choices=ThemeLook.choices, default=ThemeLook.ELEGANT)
    background_effect = models.CharField(max_length=50, choices=BackgroundEffect.choices, default=BackgroundEffect.NONE)
    is_dark_mode = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Subscription(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        CANCELLED = 'CANCELLED', 'Cancelled'

    client = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription', limit_choices_to={'role': 'CLIENT'})
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    period = models.CharField(max_length=100, help_text="e.g., '1 month', '6 months'")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.client.username} - {self.status}"
