"""
Wedding Events Seed Script
==========================
Run with:  python seed_wedding_data.py
(from the backend/ directory with venv activated)

Creates:
  - 5 beautiful wedding venues with downloaded images
  - 10 wedding events across categories:
      3 × Photography Packages
      2 × Bridal Makeup
      1 × Groom Grooming
      2 × Wedding Ceremonies
      1 × Engagement Party
      1 × Bridal Shower
  - 1 demo CLIENT user (organizer)  →  username: wedding_planner  password: Wedding@123
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
from events.models import Venue, Event, Booking
from users.models import User
from interactions.models import Comment   # import safely

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
# 1. CLEAR EXISTING DATA
# ═══════════════════════════════════════════════════════════════════════════════
print("\n🗑  Clearing existing events data...")
Booking.objects.all().delete()
try:
    Comment.objects.all().delete()
except Exception:
    pass
Event.objects.all().delete()
Venue.objects.all().delete()
print("   Done.\n")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ENSURE ORGANIZER USER EXISTS
# ═══════════════════════════════════════════════════════════════════════════════
print("👤  Setting up organizer account...")
organizer, created = User.objects.get_or_create(
    username='wedding_planner',
    defaults={
        'email': 'planner@eternallyyours.com',
        'role': 'CLIENT',
        'first_name': 'Elena',
        'last_name': 'Rosewood',
    }
)
if created:
    organizer.set_password('Wedding@123')
    organizer.save()
    print("   Created user: wedding_planner / Wedding@123")
else:
    print("   Using existing user: wedding_planner")


# ═══════════════════════════════════════════════════════════════════════════════
# 3. VENUES
# ═══════════════════════════════════════════════════════════════════════════════
print("\n🏛  Creating venues & downloading images...")

VENUES = [
    {
        "name": "The Grand Garden Pavilion",
        "address": "12 Rosewood Lane, Beverly Hills, CA 90210",
        "capacity": 400,
        "image_url": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=85&auto=format&fit=crop",
        "image_file": "venues/grand_garden_pavilion.jpg",
    },
    {
        "name": "Lakeside Manor Estate",
        "address": "88 Lakeview Drive, Lake Geneva, WI 53147",
        "capacity": 250,
        "image_url": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=85&auto=format&fit=crop",
        "image_file": "venues/lakeside_manor.jpg",
    },
    {
        "name": "The Crystal Ballroom",
        "address": "5 Diamond Avenue, Manhattan, New York, NY 10001",
        "capacity": 600,
        "image_url": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=85&auto=format&fit=crop",
        "image_file": "venues/crystal_ballroom.jpg",
    },
    {
        "name": "Vineyard Bliss Estate",
        "address": "247 Chateau Road, Napa Valley, CA 94558",
        "capacity": 180,
        "image_url": "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=1200&q=85&auto=format&fit=crop",
        "image_file": "venues/vineyard_bliss.jpg",
    },
    {
        "name": "Beachfront Serenity Chapel",
        "address": "1 Ocean Drive, Malibu, CA 90265",
        "capacity": 120,
        "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85&auto=format&fit=crop",
        "image_file": "venues/beachfront_chapel.jpg",
    },
]

created_venues = []
for v_data in VENUES:
    dest = MEDIA_ROOT / v_data["image_file"]
    success = download_image(v_data["image_url"], dest)

    venue = Venue.objects.create(
        name=v_data["name"],
        address=v_data["address"],
        capacity=v_data["capacity"],
        image=v_data["image_file"] if success else None,
    )
    created_venues.append(venue)
    print(f"   ✅ Venue: {venue.name}")


# ═══════════════════════════════════════════════════════════════════════════════
# 4. EVENTS
# ═══════════════════════════════════════════════════════════════════════════════
print("\n💍  Creating wedding events & downloading images...")

now = timezone.now()

EVENTS = [
    # ── 3 Photography Packages ────────────────────────────────────────────────
    {
        "title": "Golden Hour Wedding Photography Package",
        "description": (
            "Capture every magical moment of your wedding day with our premium Golden Hour Photography Package. "
            "Our award-winning photographers specialize in soft, romantic lighting that transforms your wedding into timeless art.\n\n"
            "📸 What's Included:\n"
            "• 10-hour full-day coverage (getting ready → reception)\n"
            "• 2 professional photographers + 1 videographer\n"
            "• 600+ edited high-resolution digital images\n"
            "• Drone aerial shots of your ceremony & venue\n"
            "• Online private gallery for 12 months\n"
            "• 1 luxury leather-bound photo album (40 pages)\n"
            "• Same-day slideshow at your reception\n\n"
            "Perfect for couples who want cinematic, editorial-style wedding photography that tells your love story beautifully. "
            "Our photographers scout each venue beforehand to identify the perfect golden hour locations, floral backdrops, and intimate corners. "
            "Every image is hand-edited with our signature warm, romantic color grading.\n\n"
            "📷 Sample Gallery: Garden ceremony portraits, bridal party formals, candid reception moments, sunset couple portraits, detail shots of rings, flowers & decor."
        ),
        "category": "WEDDING",
        "venue_idx": 0,  # Grand Garden Pavilion
        "price": 3500.00,
        "days_from_now": 45,
        "image_url": "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/photography_golden_hour.jpg",
    },
    {
        "title": "Candid Moments Wedding Documentary",
        "description": (
            "Your wedding story, told authentically. Our Documentary Photography Package focuses on genuine emotions — "
            "the laugh, the tear, the surprised grin — captured as they happen, never staged.\n\n"
            "📸 What's Included:\n"
            "• 8-hour coverage by 2 photojournalist photographers\n"
            "• 500+ unedited RAW files + 400 curated edited JPEGs\n"
            "• Black & white artistic prints (20 selected favorites)\n"
            "• Online gallery access forever\n"
            "• USB drive with all images in premium keepsake box\n\n"
            "Our documentary photographers blend into your celebration so naturally that guests forget they're being photographed. "
            "The result? Real, raw, unforgettable images you'll treasure for generations.\n\n"
            "🎞 Style includes: Candid ceremony moments, tearful vows, first dance emotions, speeches & laughter, family hugs, guest celebrations, sparkler exits.\n\n"
            "Sample images available to view during your consultation."
        ),
        "category": "WEDDING",
        "venue_idx": 2,  # Crystal Ballroom
        "price": 2800.00,
        "days_from_now": 60,
        "image_url": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/photography_candid.jpg",
    },
    {
        "title": "Luxury Fine Art Wedding Photography",
        "description": (
            "For discerning couples who demand nothing less than extraordinary — our Fine Art Photography Package "
            "delivers heirloom-quality images worthy of gallery walls.\n\n"
            "🖼 What's Included:\n"
            "• 12-hour coverage (rehearsal dinner → post-wedding brunch)\n"
            "• Lead photographer + 2 assistants + drone pilot\n"
            "• 800+ hand-retouched fine art images\n"
            "• Two 24×36 inch gallery-wrapped canvas prints\n"
            "• Premium linen-bound album (60 pages, museum quality)\n"
            "• 30-minute highlight reel video\n"
            "• Complimentary engagement session (pre-wedding)\n\n"
            "Each image is meticulously retouched using advanced color grading, fine art textures, and cinematic techniques. "
            "We work with natural light, medium format cameras, and prime lenses to create imagery that feels painterly, ethereal, and timeless.\n\n"
            "✨ Perfect for: Vineyard weddings, estate celebrations, European-style ceremonies, luxury hotel receptions.\n\n"
            "Our fine art portfolio has been featured in Vogue, Martha Stewart Weddings, and The Knot Magazine."
        ),
        "category": "WEDDING",
        "venue_idx": 3,  # Vineyard Bliss
        "price": 6500.00,
        "days_from_now": 90,
        "image_url": "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/photography_fine_art.jpg",
    },

    # ── 2 Bridal Makeup Packages ──────────────────────────────────────────────
    {
        "title": "Bridal Glow — Full Day Makeup & Hair Package",
        "description": (
            "You deserve to feel like the most beautiful version of yourself on your wedding day. "
            "Our Bridal Glow Package includes everything you need — from the first pin-curl to the final touch of perfume.\n\n"
            "💄 Services Included:\n"
            "• Bridal consultation & trial session (pre-wedding)\n"
            "• Day-of bridal makeup: full glam, natural glow, or romantic soft look\n"
            "• Airbrush foundation for long-lasting, camera-ready finish\n"
            "• Bridal hair styling: updo, half-up, waves, or braids\n"
            "• Touch-up kit (lipstick, blotting sheets, pins) for the day\n"
            "• 4 bridesmaids' makeup & hair\n"
            "• Mother of the Bride/Groom makeup\n\n"
            "💋 Products Used: Charlotte Tilbury, NARS, Hourglass, Laura Mercier, Dior — all premium, long-wearing, photogenic formulas.\n\n"
            "✨ Sample Bridal Looks Available:\n"
            "• Soft Romantic: Rosy cheeks, dewy skin, champagne eyes, berry lip\n"
            "• Classic Hollywood: Winged liner, sculpted cheek, red pout\n"
            "• Boho Garden: Bronzed glow, fluttery lashes, peach lip\n"
            "• Editorial: Bold eye, glass skin, nude lip\n\n"
            "All looks are customized to your skin tone, dress style, and venue. 8-12 hours wear-tested."
        ),
        "category": "BRIDAL",
        "venue_idx": 0,  # Grand Garden Pavilion
        "price": 1800.00,
        "days_from_now": 30,
        "image_url": "https://images.unsplash.com/photo-1597586124394-fbd6ef244026?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/bridal_makeup_glow.jpg",
    },
    {
        "title": "Ethereal Bridal Beauty Experience",
        "description": (
            "An immersive bridal beauty journey designed to make you feel deeply beautiful, confident, and radiant "
            "from the morning getting-ready ritual to your last dance.\n\n"
            "🌸 The Full Experience Includes:\n"
            "• Pre-wedding skin prep consultation (4 weeks before)\n"
            "• Morning spa ritual: facial, brow shaping, lash extensions\n"
            "• Signature bridal makeup with airbrushing\n"
            "• Luxury hair styling with extensions if desired\n"
            "• Bridal perfume consultation & custom fragrance recommendation\n"
            "• 5 bridesmaids' hair & makeup\n"
            "• On-site touch-up artist for 4 hours during reception\n\n"
            "💅 Optional Add-ons:\n"
            "• Henna bridal hand art (Mehndi)\n"
            "• Manicure & pedicure\n"
            "• Eyebrow microblading (3 weeks before)\n\n"
            "📸 Our bridal work has been photographed for:\n"
            "Brides Magazine · Style Me Pretty · Green Wedding Shoes · The Knot\n\n"
            "Every bride receives a personalized beauty timeline so the morning flows smoothly, stress-free, and beautifully."
        ),
        "category": "BRIDAL",
        "venue_idx": 4,  # Beachfront Chapel
        "price": 2400.00,
        "days_from_now": 55,
        "image_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/bridal_makeup_ethereal.jpg",
    },

    # ── 1 Groom Grooming Package ───────────────────────────────────────────────
    {
        "title": "Groom's Luxury Grooming & Styling Day",
        "description": (
            "The groom deserves to look and feel extraordinary too. Our Groom's Day package is a premium grooming "
            "experience that ensures you walk down the aisle looking sharp, polished, and effortlessly handsome.\n\n"
            "✂️ What's Included:\n"
            "• Expert barbershop haircut (scissor cut or fade) tailored to your face shape\n"
            "• Classic straight-razor hot towel shave or beard sculpting & trim\n"
            "• Scalp & face massage with premium grooming oils\n"
            "• Skin prep: deep pore cleanse + mattifying moisturizer (camera-ready)\n"
            "• Light coverage concealer (for blemishes, under-eyes — invisible in photos)\n"
            "• Eyebrow grooming & shaping\n"
            "• Manicure (clean, buffed, natural)\n"
            "• Cologne consultation & application\n"
            "• 3 groomsmen grooming sessions included\n\n"
            "💈 Products Used: Baxter of California, Aesop, Tom Ford, By Kilian\n\n"
            "🎩 Style Options:\n"
            "• The Classic Gentleman: Side-parted, pomaded, clean shave\n"
            "• The Modern Man: Textured crop, trimmed stubble\n"
            "• The Rugged Romantic: Flowing hair, full groomed beard\n"
            "• The Contemporary: Skin fade, sharp lines, clean skin\n\n"
            "Schedule 3-4 hours on the morning of your wedding. Includes light refreshments and a calming ambience."
        ),
        "category": "WEDDING",
        "venue_idx": 2,  # Crystal Ballroom
        "price": 950.00,
        "days_from_now": 38,
        "image_url": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/groom_grooming.jpg",
    },

    # ── 2 Wedding Ceremonies ───────────────────────────────────────────────────
    {
        "title": "The Rosewood Garden Wedding Ceremony",
        "description": (
            "An enchanting outdoor wedding ceremony set among 3 acres of blooming rose gardens, ancient oaks, "
            "and cascading floral arches. The Grand Garden Pavilion offers an unmatched natural backdrop that feels "
            "both intimate and grand.\n\n"
            "🌹 Ceremony Package Includes:\n"
            "• Exclusive venue hire (ceremony + cocktail hour + reception)\n"
            "• Floral arch setup: 2,000+ roses, peonies, and greenery\n"
            "• White wooden ceremony chairs (up to 400 guests)\n"
            "• Petal-lined aisle runner (10 meters)\n"
            "• PA system with wireless microphones\n"
            "• Officiant coordination\n"
            "• Cocktail hour with champagne tower\n"
            "• Dinner for up to 400: 3-course plated or lavish buffet\n"
            "• Dance floor & live string quartet\n\n"
            "🕯 Evening Highlights:\n"
            "• Lantern-lit garden pathway\n"
            "• Sparkler send-off finale\n"
            "• Fireworks display (optional add-on)\n\n"
            "This venue has hosted 200+ weddings and is consistently rated the most romantic venue in California. "
            "Every detail — from the ceremony flowers to the table linens — is personally curated for your love story."
        ),
        "category": "WEDDING",
        "venue_idx": 0,  # Grand Garden Pavilion
        "price": 12000.00,
        "days_from_now": 75,
        "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/ceremony_rosewood.jpg",
    },
    {
        "title": "Beachside Sunset Wedding Ceremony",
        "description": (
            "Exchange your vows with your feet in the sand and the Pacific Ocean as your backdrop. "
            "Our Beachside Ceremony Package creates an intimate, sun-kissed celebration that feels like paradise.\n\n"
            "🌊 Package Includes:\n"
            "• Exclusive beach ceremony site (2 hours, private section)\n"
            "• White chiffon tent / canopy setup\n"
            "• Driftwood & tropical floral altar\n"
            "• Natural seagrass seating for up to 120 guests\n"
            "• Barefoot-in-the-sand option (or elegant boardwalk aisle)\n"
            "• Sunset timing coordination for optimal golden hour\n"
            "• Reception at Beachfront Serenity Chapel (ocean view dining)\n"
            "• Seafood & coastal cuisine menu by our executive chef\n"
            "• Steel drum band for ceremony & cocktail hour\n"
            "• Boat arrival for bride (optional)\n\n"
            "🌅 The Experience:\n"
            "As the sun dips below the horizon, the sky transforms into shades of rose, amber, and gold — "
            "the most naturally romantic setting imaginable. Guests remember beach weddings forever.\n\n"
            "Limited to 12 bookings per year to ensure exclusivity. Book early."
        ),
        "category": "WEDDING",
        "venue_idx": 4,  # Beachfront Chapel
        "price": 8500.00,
        "days_from_now": 110,
        "image_url": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/ceremony_beach.jpg",
    },

    # ── 1 Engagement Party ────────────────────────────────────────────────────
    {
        "title": "Vineyard Engagement Celebration Party",
        "description": (
            "Celebrate your 'Yes!' in style amid rolling golden vines and breathtaking Napa Valley sunsets. "
            "Our Vineyard Engagement Party is an intimate gathering that sets the perfect romantic tone for your upcoming wedding.\n\n"
            "🍇 Party Package Includes:\n"
            "• Private vineyard terrace hire (4 hours, sunset timing)\n"
            "• Curated wine tasting: 6 estate wines (red, white, rosé, sparkling)\n"
            "• Artisanal cheese & charcuterie boards\n"
            "• Farm-to-table canapé reception (30+ gourmet bites)\n"
            "• Custom floral centrepieces (garden rose + eucalyptus)\n"
            "• Personalized 'Just Engaged' signage & balloon installation\n"
            "• Professional couple portrait session (1 hour, golden hour)\n"
            "• Custom Polaroid photo booth with props\n"
            "• Up to 60 guests\n\n"
            "🥂 The Atmosphere:\n"
            "Soft string lights strung across the vine canopy, the scent of ripe grapes in the warm evening air, "
            "laughter and clinking glasses as your loved ones celebrate the beginning of your forever. Pure magic.\n\n"
            "Optional add-ons: Custom wine label with your names, couple's cooking class, helicopter tour of the valley."
        ),
        "category": "ENGAGEMENT",
        "venue_idx": 3,  # Vineyard Bliss
        "price": 4200.00,
        "days_from_now": 22,
        "image_url": "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/engagement_vineyard.jpg",
    },

    # ── 1 Bridal Shower ───────────────────────────────────────────────────────
    {
        "title": "The Enchanted Bridal Shower Tea Party",
        "description": (
            "A whimsical, elegant bridal shower experience designed to celebrate the bride-to-be with her dearest "
            "friends and family. Think floral crowns, fine china, and laughter that fills the afternoon.\n\n"
            "🌸 Shower Package Includes:\n"
            "• Lakeside Manor private terrace rental (3 hours)\n"
            "• Dressed tables: ivory linen, gold cutlery, crystal glassware\n"
            "• Afternoon high tea: finger sandwiches, scones, petit fours, macarons\n"
            "• Signature cocktails & sparkling mocktails\n"
            "• Floral crown making workshop for all guests\n"
            "• Personalized gift table with ribbon & bow decoration\n"
            "• Bridal-themed games: Mr. & Mrs. trivia, bridal bingo, dress-the-bride\n"
            "• Flower wall backdrop for group photos\n"
            "• Custom bride-to-be sash & tiara\n"
            "• Up to 30 guests\n\n"
            "🎀 Themes Available:\n"
            "• Garden Party (blush & sage)\n"
            "• Parisian Chic (ivory & gold)\n"
            "• Tropical Florals (coral & tropical greens)\n"
            "• Vintage Romance (dusty rose & champagne)\n\n"
            "Each bridal shower is uniquely styled to reflect the bride's personality. A custom stationery suite "
            "(invitations, menus, place cards) is included in every package.\n\n"
            "We handle everything — you just show up and celebrate!"
        ),
        "category": "BRIDAL",
        "venue_idx": 1,  # Lakeside Manor
        "price": 2200.00,
        "days_from_now": 15,
        "image_url": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85&auto=format&fit=crop",
        "image_file": "events/bridal_shower.jpg",
    },
]

created_events = []
for i, e_data in enumerate(EVENTS):
    dest = MEDIA_ROOT / e_data["image_file"]
    success = download_image(e_data["image_url"], dest)

    venue = created_venues[e_data["venue_idx"]]
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
    created_events.append(event)
    print(f"   ✅ [{i+1}/10] {event.title[:55]}...")


# ═══════════════════════════════════════════════════════════════════════════════
# 5. SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("✨  WEDDING DATA SEEDED SUCCESSFULLY!")
print("═" * 60)
print(f"   Venues   : {Venue.objects.count()}")
print(f"   Events   : {Event.objects.count()}")
print(f"   Organizer: wedding_planner / Wedding@123")
print("═" * 60)
print("\n   Visit http://localhost:4200/ to see your wedding platform!\n")
