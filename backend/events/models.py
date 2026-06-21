from django.db import models
from django.conf import settings

class Venue(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    country = models.CharField(max_length=100, default='India')
    state = models.CharField(max_length=100, default='Kerala')
    district = models.CharField(max_length=100, blank=True, null=True)
    capacity = models.PositiveIntegerField()
    image = models.ImageField(upload_to='venues/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Event(models.Model):
    class Category(models.TextChoices):
        WEDDING = 'WEDDING', 'Wedding Ceremony'
        RECEPTION = 'RECEPTION', 'Wedding Reception'
        ENGAGEMENT = 'ENGAGEMENT', 'Engagement Party'
        REHEARSAL = 'REHEARSAL', 'Rehearsal Dinner'
        BRIDAL = 'BRIDAL', 'Bridal Shower'
        PHOTOGRAPHY = 'PHOTOGRAPHY', 'Photography & Videography'
        CATERING = 'CATERING', 'Catering & Food'
        DECORATION = 'DECORATION', 'Floral & Decoration'
        MUSIC = 'MUSIC', 'Music & Entertainment'
        OTHER = 'OTHER', 'Other Celebration'

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.WEDDING)
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, related_name='events')
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'CLIENT'})
    date = models.DateTimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    image = models.ImageField(upload_to='events/', null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    enquiry_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookings')
    tickets = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.event.title} ({self.status})"

class EventGalleryImage(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='events/gallery/')
    caption = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Gallery Image for {self.event.title}"

class Enquiry(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='enquiries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='enquiries')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Enquiry for {self.event.title} by {self.user.username if self.user else 'Unknown User'}"
