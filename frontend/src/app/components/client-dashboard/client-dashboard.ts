import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event/event';
import { RouterModule } from '@angular/router';
import { API_BASE } from '../../constants';

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

  venueForm = { name: '', address: '', capacity: 0 };
  venueImage: File | null = null;

  eventForm = { title: '', description: '', category: 'WEDDING', venue: '', date: '', price: 0 };
  eventImage: File | null = null;

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.eventService.getVenues().subscribe(v => this.venues = v);
    
    this.eventService.getEvents(undefined, 'me').subscribe(events => {
      this.managedEvents = events;
    });
  }

  onVenueImageSelected(event: any) {
    this.venueImage = event.target.files[0];
  }

  onEventImageSelected(event: any) {
    this.eventImage = event.target.files[0];
  }

  submitVenue() {
    const fd = new FormData();
    fd.append('name', this.venueForm.name);
    fd.append('address', this.venueForm.address);
    fd.append('capacity', this.venueForm.capacity.toString());
    if (this.venueImage) fd.append('image', this.venueImage);

    this.eventService.addVenue(fd).subscribe(() => {
      alert('Venue registered!');
      this.loadData();
    });
  }

  submitEvent() {
    const fd = new FormData();
    fd.append('title', this.eventForm.title);
    fd.append('description', this.eventForm.description);
    fd.append('category', this.eventForm.category);
    fd.append('venue', this.eventForm.venue);
    
    try {
      if (!this.eventForm.date) {
        alert('Please select a valid date and time.');
        return;
      }
      const dt = new Date(this.eventForm.date).toISOString();
      fd.append('date', dt);
    } catch (e) {
      alert('Invalid date format. Please try again.');
      return;
    }

    fd.append('price', this.eventForm.price.toString());
    if (this.eventImage) fd.append('image', this.eventImage);

    this.eventService.addEvent(fd).subscribe({
      next: () => {
        alert('Wedding event published!');
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to publish event:', err);
        alert('Failed to publish event. Please check the form fields.');
      }
    });
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
