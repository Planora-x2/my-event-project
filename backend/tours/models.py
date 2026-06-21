from django.db import models

class Tour(models.Model):
    destination = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField()
    duration_days = models.PositiveIntegerField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    image = models.ImageField(upload_to='tours/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class TourBooking(models.Model):
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name='bookings')
    pilgrim_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    travel_date = models.DateField()
    passenger_count = models.PositiveIntegerField(default=1)
    special_requirements = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pilgrim_name} - {self.tour.title}"
