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
    custom_venue_lng: 0
  };

  venueMode: 'existing' | 'custom' = 'existing';
  map: any;
  marker: any;

  venues: Venue[] = [];
  generatedLink: string | null = null;
  loading = false;
  previewImage: string | ArrayBuffer | null = null;

  templates = [
    { id: 'classic', name: 'Classic Elegance' },
    { id: 'modern', name: 'Modern Minimalist' },
    { id: 'floral', name: 'Floral Bloom' },
    { id: 'royal', name: 'Royal Heritage' },
    { id: 'rustic', name: 'Rustic Charm' },
    { id: 'ocean', name: 'Ocean Breeze' },
    { id: 'vintage', name: 'Vintage Elegance' },
    { id: 'neon', name: 'Neon Vibes' },
    { id: 'sunset', name: 'Sunset Glow' },
    { id: 'tropical', name: 'Tropical Paradise' },
    { id: 'pastel', name: 'Pastel Dream' },
    { id: 'navygold', name: 'Navy & Gold' },
    { id: 'watercolor', name: 'Watercolor Rose' },
    { id: 'traditional', name: 'Traditional Arch' },
    { id: 'botanical', name: 'Botanical Minimal' },
    { id: 'blue-classic', name: 'Ice Blue Classic' },
    { id: 'olive-arch', name: 'Olive Green Arch' },
    { id: 'blue-splash', name: 'Blue Watercolor Splash' },
    { id: 'red-elegant', name: 'Deep Red Elegance' },
    { id: 'pink-floral', name: 'Pink Floral Border' },
    { id: 'gold-mandala', name: 'Golden Mandala' },
    { id: 'teal-laser', name: 'Teal Laser Cut' },
    { id: 'peach-splash', name: 'Peach Splash' },
    { id: 'navy-gold-leaf', name: 'Navy Gold Leaf' },
    { id: 'photo-timeline', name: 'Photo Timeline' },
    { id: 'rose-garden', name: 'Rose Garden' },
    { id: 'eucalyptus', name: 'Eucalyptus Wreath' },
    { id: 'lotus', name: 'Lotus Elegance' }
  ];

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
