import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WeddingCardService } from '../../services/wedding-card/wedding-card.service';
import { ToastService } from '../../services/toast/toast';
import { WeddingCard, Venue } from '../../models/wedding-card.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-wedding-card-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wedding-card-generator.component.html',
  styleUrls: ['./wedding-card-generator.component.css']
})
export class WeddingCardGeneratorComponent implements OnInit {
  card: WeddingCard = {
    bride_name: '',
    groom_name: '',
    date: '',
    venue: null,
    template_id: 'classic',
    message: 'Join us to celebrate our wedding!',
    primary_color: '#D4AF37',
    background_color: '#FFFFFF',
    font_family: 'Playfair Display',
    is_custom_venue: false,
    custom_venue_name: '',
    custom_venue_address: '',
    custom_venue_lat: 0,
    custom_venue_lng: 0,
    is_save_the_date: false
  };

  venueMode: 'existing' | 'custom' = 'existing';
  map: any;
  marker: any;

  venues: Venue[] = [];
  generatedLink: string | null = null;
  qrCodeUrl: string | null = null;
  loading = false;
  previewImage: string | ArrayBuffer | null = null;

  templates = [
    { id: 'classic', name: 'Classic Elegance', category: 'normal' },
    { id: 'modern', name: 'Modern Minimalist', category: 'normal' },
    { id: 'floral', name: 'Floral Bloom', category: 'normal' },
    { id: 'royal', name: 'Royal Heritage', category: 'normal' },
    { id: 'rustic', name: 'Rustic Charm', category: 'normal' },
    { id: 'ocean', name: 'Ocean Breeze', category: 'normal' },
    { id: 'vintage', name: 'Vintage Elegance', category: 'normal' },
    { id: 'neon', name: 'Neon Vibes', category: 'normal' },
    { id: 'sunset', name: 'Sunset Glow', category: 'normal' },
    { id: 'tropical', name: 'Tropical Paradise', category: 'normal' },
    { id: 'pastel', name: 'Pastel Dream', category: 'normal' },
    { id: 'navygold', name: 'Navy & Gold', category: 'normal' },
    { id: 'watercolor', name: 'Watercolor Rose', category: 'normal' },
    { id: 'traditional', name: 'Traditional Arch', category: 'normal' },
    { id: 'botanical', name: 'Botanical Minimal', category: 'normal' },
    { id: 'blue-classic', name: 'Ice Blue Classic', category: 'normal' },
    { id: 'olive-arch', name: 'Olive Green Arch', category: 'normal' },
    { id: 'blue-splash', name: 'Blue Watercolor Splash', category: 'normal' },
    { id: 'red-elegant', name: 'Deep Red Elegance', category: 'normal' },
    { id: 'pink-floral', name: 'Pink Floral Border', category: 'normal' },
    { id: 'gold-mandala', name: 'Golden Mandala', category: 'normal' },
    { id: 'teal-laser', name: 'Teal Laser Cut', category: 'normal' },
    { id: 'peach-splash', name: 'Peach Splash', category: 'normal' },
    { id: 'navy-gold-leaf', name: 'Navy Gold Leaf', category: 'normal' },
    { id: 'photo-timeline', name: 'Photo Timeline', category: 'normal' },
    { id: 'rose-garden', name: 'Rose Garden', category: 'normal' },
    { id: 'eucalyptus', name: 'Eucalyptus Wreath', category: 'normal' },
    { id: 'lotus', name: 'Lotus Elegance', category: 'normal' },
    // Premium Templates
    { id: 'premium-blue-floral', name: 'Blue Floral Elegance', category: 'premium' },
    { id: 'premium-pink-vine', name: 'Vintage Pink Vine', category: 'premium' },
    { id: 'premium-vintage-ribbon', name: 'Classic Ribbon', category: 'premium' },
    { id: 'premium-indian-traditional', name: 'Royal Indian', category: 'premium' },
    { id: 'premium-teal-floral', name: 'Teal 3D Floral', category: 'premium' }
  ];

  get normalTemplates() {
    return this.templates.filter(t => t.category === 'normal');
  }

  get premiumTemplates() {
    return this.templates.filter(t => t.category === 'premium');
  }

  fonts = [
    { id: 'Playfair Display', name: 'Playfair Display (Serif)' },
    { id: 'Montserrat', name: 'Montserrat (Sans-Serif)' },
    { id: 'Great Vibes', name: 'Great Vibes (Cursive)' },
    { id: 'Lora', name: 'Lora (Serif)' },
    { id: 'Georgia', name: 'Georgia (Serif)' },
    { id: 'Helvetica Neue', name: 'Helvetica Neue (Sans-Serif)' }
  ];

  constructor(
    private weddingCardService: WeddingCardService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!localStorage.getItem('is_logged_in')) {
      this.toastService.show('Please sign in or sign up to generate a wedding card', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    this.weddingCardService.getVenues().subscribe({
      next: (res) => {
        this.venues = res;
      },
      error: (err) => {
        console.error('Failed to load venues', err);
        this.toastService.show('Could not load venues', 'warning');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.card.cover_image = file;
      
      const reader = new FileReader();
      reader.onload = e => this.previewImage = reader.result;
      reader.readAsDataURL(file);
    }
  }

  toggleVenueMode(mode: 'existing' | 'custom') {
    this.venueMode = mode;
    this.card.is_custom_venue = (mode === 'custom');
    if (mode === 'custom') {
      setTimeout(() => this.initMap(), 100);
    }
  }

  initMap() {
    if (this.map) return; // already initialized
    
    // Default to center of India
    const lat = 20.5937;
    const lng = 78.9629;

    this.map = L.map('venue-map').setView([lat, lng], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.card.custom_venue_lat = lat;
      this.card.custom_venue_lng = lng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        // Fix Leaflet's default icon missing issue by using custom SVG or standard paths if properly set up. 
        // Using a basic circle marker to avoid icon 404s
        this.marker = L.circleMarker([lat, lng], {
          color: '#e53e3e',
          fillColor: '#f56565',
          fillOpacity: 1,
          radius: 8
        }).addTo(this.map);
      }
    });
  }

  generateCard() {
    if (!this.card.bride_name || !this.card.groom_name || !this.card.date) {
      this.toastService.show('Please fill in all required fields', 'warning');
      return;
    }

    if (this.venueMode === 'existing' && !this.card.venue) {
      this.toastService.show('Please select a venue', 'warning');
      return;
    }

    if (this.venueMode === 'custom' && (!this.card.custom_venue_name || !this.card.custom_venue_address)) {
      this.toastService.show('Please enter the custom venue name and address', 'warning');
      return;
    }

    this.loading = true;
    this.weddingCardService.createCard(this.card).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.show('Wedding Card Generated Successfully!', 'info');
        const origin = window.location.origin;
        this.generatedLink = `${origin}/wedding-card/${res.id}`;
        // Using an external API for the QR code
        this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(this.generatedLink)}`;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error generating card', err);
        this.toastService.show('Failed to generate card', 'warning');
      }
    });
  }

  copyLink() {
    if (this.generatedLink) {
      navigator.clipboard.writeText(this.generatedLink);
      this.toastService.show('Link copied to clipboard!', 'info');
    }
  }

  viewCard() {
    if (this.generatedLink) {
      window.open(this.generatedLink, '_blank');
    }
  }
}
