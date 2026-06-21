import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from events.models import Event

def add_dummy_locations():
    events = Event.objects.all()
    updated = 0
    
    # Rough bounding box for a sample city or diverse locations
    # Let's use New York as a center (40.7128, -74.0060)
    for event in events:
        if event.latitude is None or event.longitude is None:
            # Generate random offset
            lat_offset = random.uniform(-0.1, 0.1)
            lng_offset = random.uniform(-0.1, 0.1)
            
            event.latitude = 40.7128 + lat_offset
            event.longitude = -74.0060 + lng_offset
            event.save()
            updated += 1
            
    print(f"Updated {updated} events with dummy locations.")

if __name__ == '__main__':
    add_dummy_locations()
