"""
Photography Data Seed Script
============================
Run with:  python seed_photography_data.py
(from the backend/ directory with venv activated)

Creates:
  - Several custom photography packages under the wedding_planner account.
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
from django.utils import timezone
from datetime import timedelta
from events.models import Venue, Event
from users.models import User

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
        print(f"  [OK] Downloaded -> {dest_path.name}")
        return True
    except Exception as e:
        print(f"  [FAIL] Failed to download {url}: {e}")
        return False

# ═══════════════════════════════════════════════════════════════════════════════
# 1. ENSURE ORGANIZER USER EXISTS
# ═══════════════════════════════════════════════════════════════════════════════
print("Setting up organizer account...")
try:
    organizer = User.objects.get(username='wedding_planner')
    print("   Found existing user: wedding_planner")
except User.DoesNotExist:
    organizer = User.objects.create_user(
        username='wedding_planner',
        password='Wedding@123',
        email='planner@eternallyyours.com',
        role='CLIENT',
        first_name='Elena',
        last_name='Rosewood',
    )
    print("   Created user: wedding_planner / Wedding@123")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ENSURE VENUE EXISTS
# ═══════════════════════════════════════════════════════════════════════════════
print("\nEnsuring venue exists for photography sessions...")
venue, created = Venue.objects.get_or_create(
    name="Studio Blanc",
    defaults={
        "address": "42 Arts District Blvd, Los Angeles, CA 90013",
        "capacity": 50,
        "image": "venues/studio_blanc.jpg",
    }
)
if created:
    dest = MEDIA_ROOT / "venues" / "studio_blanc.jpg"
    download_image("https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1200&q=85&auto=format&fit=crop", dest)
    print(f"   [OK] Created Venue: {venue.name}")
else:
    print(f"   [OK] Using existing Venue: {venue.name}")

# ═══════════════════════════════════════════════════════════════════════════════
# 3. CREATE PHOTOGRAPHY EVENTS
# ═══════════════════════════════════════════════════════════════════════════════
print("\nCreating photography events & downloading images...")

now = timezone.now()

EVENTS = [
    {
        "title": "Pre-Wedding Editorial Photoshoot",
        "description": (
            "Capture the magic of your engagement with a high-fashion, editorial style photoshoot.\n\n"
            "📸 What's Included:\n"
            "• 4-hour session at 2 locations of your choice\n"
            "• Creative direction and styling consultation\n"
            "• 50 retouched high-resolution images\n"
            "• Signature black and white edits included\n"
            "• 2 wardrobe changes\n"
        ),
        "category": "PHOTOGRAPHY",
        "price": 1200.00,
        "days_from_now": 20,
        "image_url": "https://images.unsplash.com/photo-1542042161784-26ab9e041e89?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/photo_pre_wedding.jpg",
    },
    {
        "title": "Cinematic Wedding Videography",
        "description": (
            "Tell the story of your special day through a beautifully crafted cinematic short film.\n\n"
            "🎥 What's Included:\n"
            "• Full day coverage (up to 12 hours)\n"
            "• 2 lead cinematographers\n"
            "• Drone footage of the venue\n"
            "• 5-7 minute highlight film\n"
            "• Full-length documentary edit of ceremony and speeches\n"
        ),
        "category": "VIDEOGRAPHY",
        "price": 4500.00,
        "days_from_now": 40,
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/video_cinematic.jpg",
    },
    {
        "title": "Analog Film Wedding Photography",
        "description": (
            "For the nostalgics: a photography package shot entirely on vintage 35mm and medium format film.\n\n"
            "🎞️ What's Included:\n"
            "• 8-hour coverage\n"
            "• Mix of color (Portra 400) and B&W (Tri-X 400) film stocks\n"
            "• All film development and high-res scanning included\n"
            "• 300 final images\n"
            "• Keepsake box with physical 4x6 prints\n"
        ),
        "category": "PHOTOGRAPHY",
        "price": 3800.00,
        "days_from_now": 60,
        "image_url": "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/photo_analog.jpg",
    }
]

created_count = 0
for i, e_data in enumerate(EVENTS):
    # Avoid duplicating if script is run multiple times
    if not Event.objects.filter(title=e_data["title"]).exists():
        dest = MEDIA_ROOT / e_data["image_file"]
        success = download_image(e_data["image_url"], dest)

        event_date = now + timedelta(days=e_data["days_from_now"])

        event = Event.objects.create(
            title=e_data["title"],
            description=e_data["description"],
            category=e_data["category"],
            venue=venue,
            client=organizer,
            date=event_date,
            price=e_data["price"],
            image=e_data["image_file"] if success else None,
        )
        created_count += 1
        print(f"   [OK] Created: {event.title[:55]}...")
    else:
        print(f"   [SKIP] Skipped (Already exists): {e_data['title']}")

print("\n" + "=" * 60)
print(f"SEEDED {created_count} NEW PHOTOGRAPHY EVENTS!")
print("=" * 60)
