"""
Event Gallery Seed Script
=========================
Run with:  python seed_gallery_data.py
(from the backend/ directory with venv activated)

This script downloads 3 beautiful Unsplash images for each of the existing events
and attaches them as EventGalleryImage records to create a stunning gallery.
"""

import os
import sys
import django
import urllib.request
import shutil
from pathlib import Path

# ── Bootstrap Django ─────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# ── Imports after setup ───────────────────────────────────────────────────────
from django.conf import settings
from events.models import Event, EventGalleryImage

MEDIA_ROOT = Path(settings.MEDIA_ROOT)

def download_image(url: str, dest_path: Path) -> bool:
    """Download an image from URL into dest_path. Returns True on success."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        )
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open(dest_path, 'wb') as f:
                shutil.copyfileobj(resp, f)
        print(f"  ✓ Downloaded → {dest_path.name}")
        return True
    except Exception as e:
        print(f"  ✗ Failed to download {url}: {e}")
        return False

# ═══════════════════════════════════════════════════════════════════════════════
# GALLERY DATA (High Quality Unsplash IDs mapped to generic categories)
# ═══════════════════════════════════════════════════════════════════════════════

GALLERY_SAMPLES = {
    'WEDDING': [
        ("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85&auto=format&fit=crop", "The perfect moment captured forever."),
        ("https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85&auto=format&fit=crop", "Elegant floral arrangements gracing the tables."),
        ("https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=85&auto=format&fit=crop", "A stunning view of the wedding ceremony setting.")
    ],
    'RECEPTION': [
        ("https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=85&auto=format&fit=crop", "The reception hall ready for the grand entrance."),
        ("https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=85&auto=format&fit=crop", "Guests celebrating under crystal chandeliers."),
        ("https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1200&q=85&auto=format&fit=crop", "A toast to the beautiful newly weds.")
    ],
    'ENGAGEMENT': [
        ("https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=85&auto=format&fit=crop", "The joyful moment of saying 'Yes!'"),
        ("https://images.unsplash.com/photo-1510076857177-7470076d4098?w=1200&q=85&auto=format&fit=crop", "A beautiful sunset setting the perfect romantic scene."),
        ("https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=1200&q=85&auto=format&fit=crop", "Toasting to a future filled with love.")
    ],
    'BRIDAL': [
        ("https://images.unsplash.com/photo-1597586124394-fbd6ef244026?w=1200&q=85&auto=format&fit=crop", "Bridal preparations in the morning light."),
        ("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85&auto=format&fit=crop", "The stunning details of the bridal gown."),
        ("https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=85&auto=format&fit=crop", "Joy and laughter with the bridesmaids.")
    ]
}

# Fallback for OTHER
FALLBACK_PICS = [
    ("https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=85&auto=format&fit=crop", "A beautiful celebration."),
    ("https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85&auto=format&fit=crop", "Joyous moments shared with loved ones."),
    ("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=85&auto=format&fit=crop", "Meticulously planned details.")
]

print("\n🖼️  Clearing old gallery images...")
EventGalleryImage.objects.all().delete()

events = Event.objects.all()
if not events.exists():
    print("❌ No events found in the database. Please run seed_wedding_data.py first.")
    sys.exit(1)

print(f"\n📸 Seeding gallery images for {events.count()} events...")

total_seeded = 0
for event in events:
    print(f"\nProcessing: {event.title}")
    
    samples = GALLERY_SAMPLES.get(event.category, FALLBACK_PICS)
    
    for idx, (url, caption) in enumerate(samples):
        filename = f"gallery_evt{event.id}_{idx}.jpg"
        dest = MEDIA_ROOT / 'events' / 'gallery' / filename
        
        success = download_image(url, dest)
        if success:
            EventGalleryImage.objects.create(
                event=event,
                image=f"events/gallery/{filename}",
                caption=caption
            )
            total_seeded += 1

print("\n" + "═" * 60)
print("✨  GALLERY DATA SEEDED SUCCESSFULLY!")
print("═" * 60)
print(f"   Total Gallery Images: {total_seeded}")
print("═" * 60)
