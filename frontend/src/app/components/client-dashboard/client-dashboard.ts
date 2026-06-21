import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event/event';
import { AuthService } from '../../services/auth/auth';
import { ToastService } from '../../services/toast/toast';
import { RouterModule } from '@angular/router';
import { API_BASE } from '../../constants';
import * as L from 'leaflet';
import { Country, State, City } from 'country-state-city';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.css',
})
export class ClientDashboardComponent implements OnInit {
  venues: any[] = [];
  managedEvents: any[] = [];

  venueForm = { name: '', address: '', capacity: 0, country: 'IN', state: 'KL', district: '' };
  venueImage: File | null = null;
  editingVenueId: number | null = null;

  countries = Country.getAllCountries();
  states: any[] = [];
  districts: any[] = [];

  eventForm = { title: '', description: '', category: 'WEDDING', venue: '', date: '', price: 0, latitude: null as number | null, longitude: null as number | null };
  eventImage: File | null = null;
  eventImages: File[] = [];
  editingEventId: number | null = null;
  
  pickerMap: L.Map | null = null;
  pickerMarker: L.Marker | null = null;
  mapSearchQuery: string = '';

  subscription: any = null;
  subRequestPeriod: string = '';
  isAdmin: boolean = false;

  constructor(
    private eventService: EventService, 
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        if (user.role === 'ADMIN') {
          this.isAdmin = true;
          this.initPickerMap();
        } else if (user.role === 'CLIENT') {
          this.loadSubscription();
        }
      }
    });
    this.states = State.getStatesOfCountry('IN');
    this.districts = City.getCitiesOfState('IN', 'KL');
    this.loadData();
  }

  loadSubscription() {
    this.authService.getSubscriptions().subscribe(subs => {
      if (subs && subs.length > 0) {
        this.subscription = subs[0];
        if (this.subscription.status === 'APPROVED') {
          this.initPickerMap();
        }
      }
      this.cdr.detectChanges();
    });
  }

  requestSubscription() {
    if (!this.subRequestPeriod.trim()) {
      this.toastService.show('Please enter a period (e.g. "6 months")', 'warning');
      return;
    }
    this.authService.requestSubscription(this.subRequestPeriod).subscribe(() => {
      this.toastService.show('Subscription requested successfully! Please wait for admin approval.', 'info');
      this.loadSubscription();
    });
  }

  initPickerMap() {
    if (this.pickerMap) return;
    
    const el = document.getElementById('picker-map');
    if (!el) {
      setTimeout(() => this.initPickerMap(), 200);
      return;
    }

    // Default to Kerala, India
    this.pickerMap = L.map('picker-map').setView([10.8505, 76.2711], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.pickerMap);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    this.pickerMap.on('click', (e: any) => {
      this.eventForm.latitude = e.latlng.lat;
      this.eventForm.longitude = e.latlng.lng;
      
      if (this.pickerMarker) {
        this.pickerMarker.setLatLng(e.latlng);
      } else {
        this.pickerMarker = L.marker(e.latlng, { icon }).addTo(this.pickerMap!);
      }
    });
    
    setTimeout(() => {
      this.pickerMap?.invalidateSize();
    }, 200);
  }

  async searchLocation() {
    if (!this.mapSearchQuery.trim() || !this.pickerMap) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.mapSearchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        this.pickerMap.setView([lat, lon], 12);
        
        this.eventForm.latitude = lat;
        this.eventForm.longitude = lon;
        
        if (this.pickerMarker) {
          this.pickerMarker.setLatLng([lat, lon]);
        } else {
          const icon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
          });
          this.pickerMarker = L.marker([lat, lon], { icon }).addTo(this.pickerMap);
        }
      } else {
        this.toastService.show('Location not found. Try a different search term.', 'warning');
      }
    } catch (e) {
      this.toastService.show('Failed to search location.', 'warning');
    }
  }

  loadData() {
    this.eventService.getVenues().subscribe(v => {
      this.venues = v;
      this.cdr.detectChanges();
    });
    
    this.eventService.getEvents(undefined, 'me').subscribe(events => {
      this.managedEvents = events;
      this.cdr.detectChanges();
    });
  }

  onVenueImageSelected(event: any) {
    this.venueImage = event.target.files[0];
  }

  onEventImageSelected(event: any) {
    this.eventImage = event.target.files[0];
  }

  onGalleryImagesSelected(event: any) {
    if (event.target.files) {
      this.eventImages = Array.from(event.target.files);
    }
  }

  editVenue(venue: any) {
    this.editingVenueId = venue.id;
    
    const countryObj = Country.getAllCountries().find(c => c.name === venue.country) || Country.getCountryByCode('IN');
    const countryCode = countryObj?.isoCode || 'IN';
    
    this.states = State.getStatesOfCountry(countryCode);
    const stateObj = this.states.find(s => s.name === venue.state) || State.getStateByCodeAndCountry('KL', 'IN');
    const stateCode = stateObj?.isoCode || 'KL';
    
    this.districts = City.getCitiesOfState(countryCode, stateCode);
    
    this.venueForm = { 
      name: venue.name, 
      address: venue.address, 
      capacity: venue.capacity,
      country: countryCode,
      state: stateCode,
      district: venue.district || ''
    };
    
    this.venueImage = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteVenue(id: number) {
    if (confirm('Are you sure you want to delete this venue?')) {
      this.eventService.deleteVenue(id).subscribe(() => {
        this.toastService.show('Venue deleted.', 'info');
        this.loadData();
      });
    }
  }

  resetVenueForm() {
    this.editingVenueId = null;
    this.venueForm = { name: '', address: '', capacity: 0, country: 'IN', state: 'KL', district: '' };
    this.states = State.getStatesOfCountry('IN');
    this.districts = City.getCitiesOfState('IN', 'KL');
    this.venueImage = null;
  }

  submitVenue() {
    const fd = new FormData();
    fd.append('name', this.venueForm.name);
    fd.append('address', this.venueForm.address);
    fd.append('capacity', this.venueForm.capacity.toString());
    
    const countryName = Country.getCountryByCode(this.venueForm.country)?.name || 'India';
    const stateName = State.getStateByCodeAndCountry(this.venueForm.state, this.venueForm.country)?.name || 'Kerala';
    
    fd.append('country', countryName);
    fd.append('state', stateName);
    fd.append('district', this.venueForm.district);
    
    if (this.venueImage) fd.append('image', this.venueImage);

    const req = this.editingVenueId
      ? this.eventService.updateVenue(this.editingVenueId, fd)
      : this.eventService.addVenue(fd);

    req.subscribe(() => {
      this.toastService.show(this.editingVenueId ? 'Venue updated!' : 'Venue registered!', 'info');
      this.resetVenueForm();
      this.loadData();
    });
  }

  editEvent(event: any) {
    this.editingEventId = event.id;
    this.eventForm = {
      title: event.title,
      description: event.description,
      category: event.category,
      venue: event.venue || '',
      date: event.date ? event.date.substring(0, 16) : '',
      price: event.price,
      latitude: event.latitude,
      longitude: event.longitude
    };
    this.eventImage = null;
    this.eventImages = [];
    
    if (this.pickerMarker && event.latitude && event.longitude) {
      this.pickerMarker.setLatLng([event.latitude, event.longitude]);
      this.pickerMap?.setView([event.latitude, event.longitude], 10);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteEvent(id: number) {
    if (confirm('Are you sure you want to delete this service listing?')) {
      this.eventService.deleteEvent(id).subscribe(() => {
        this.toastService.show('Service listing deleted.', 'info');
        this.loadData();
      });
    }
  }

  onCountryChange() {
    this.states = State.getStatesOfCountry(this.venueForm.country);
    this.venueForm.state = '';
    this.venueForm.district = '';
    this.districts = [];
    this.updateMapLocation();
  }

  onStateChange() {
    this.districts = City.getCitiesOfState(this.venueForm.country, this.venueForm.state);
    this.venueForm.district = '';
    this.updateMapLocation();
  }

  onDistrictChange() {
    this.updateMapLocation();
  }

  updateMapLocation() {
    const countryObj = Country.getCountryByCode(this.venueForm.country);
    const stateObj = State.getStateByCodeAndCountry(this.venueForm.state, this.venueForm.country);
    
    let query = '';
    if (this.venueForm.district) query += this.venueForm.district + ', ';
    if (stateObj) query += stateObj.name + ', ';
    if (countryObj) query += countryObj.name;
    
    if (query) {
      this.mapSearchQuery = query;
      this.searchLocation();
    }
  }

  resetEventForm() {
    this.editingEventId = null;
    this.eventForm = { title: '', description: '', category: 'WEDDING', venue: '', date: '', price: 0, latitude: null, longitude: null };
    this.eventImage = null;
    this.eventImages = [];
  }

  submitEvent() {
    const fd = new FormData();
    fd.append('title', this.eventForm.title);
    fd.append('description', this.eventForm.description);
    fd.append('category', this.eventForm.category);
    if (this.eventForm.venue) fd.append('venue', this.eventForm.venue);
    
    try {
      if (!this.eventForm.date && this.eventForm.category !== 'PHOTOGRAPHY' && this.eventForm.category !== 'DECORATION') {
        // Let's not make date strictly required for everything, but if it is passed, parse it.
      }
      if (this.eventForm.date) {
        const dt = new Date(this.eventForm.date).toISOString();
        fd.append('date', dt);
      }
    } catch (e) {
      this.toastService.show('Invalid date format. Please try again.', 'warning');
      return;
    }

    if (this.eventForm.latitude) fd.append('latitude', this.eventForm.latitude.toString());
    if (this.eventForm.longitude) fd.append('longitude', this.eventForm.longitude.toString());

    fd.append('price', this.eventForm.price.toString());
    if (this.eventImage) fd.append('image', this.eventImage);

    const req = this.editingEventId
      ? this.eventService.updateEvent(this.editingEventId, fd)
      : this.eventService.addEvent(fd);

    req.subscribe({
      next: (response) => {
        const eventId = response.id || this.editingEventId;
        
        if (this.eventImages.length > 0 && eventId) {
          const galleryFd = new FormData();
          this.eventImages.forEach(file => {
            galleryFd.append('images', file);
          });
          this.eventService.uploadGalleryImage(eventId, galleryFd).subscribe({
             next: () => this.finishEventSubmit(true),
             error: () => this.finishEventSubmit(false)
          });
        } else {
          this.finishEventSubmit(true);
        }
      },
      error: (err) => {
        console.error('Failed to publish event:', err);
        this.toastService.show('Failed to save service. Please check the form fields.', 'warning');
      }
    });
  }

  finishEventSubmit(success: boolean) {
    if (success) {
      this.toastService.show(this.editingEventId ? 'Service updated!' : 'Service published!', 'info');
      this.resetEventForm();
      this.loadData();
    } else {
      this.toastService.show('Service saved, but failed to upload gallery images.', 'warning');
      this.resetEventForm();
      this.loadData();
    }
  }

  getTotalCapacity(): number {
    return this.venues.reduce((sum: number, v: any) => sum + (v.capacity || 0), 0);
  }

  getEventImageUrl(url: string | null): string {
    if (!url) return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  }
}
