import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event/event';
import { ToastService } from '../../services/toast/toast';
import { SavedVendorService } from '../../services/saved-vendor/saved-vendor';
import { API_BASE } from '../../constants';

@Component({
  selector: 'app-event-list',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css'
})
export class EventListComponent implements OnInit {
  events: any[] = [];
  displayedEvents: any[] = [];
  allEvents: any[] = [];
  locationQuery: string = '';
  categoryQuery: string = 'ALL';
  ratingQuery: number = 0;
  loading: boolean = true;
  page: number = 1;
  pageSize: number = 12;

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private savedVendorService: SavedVendorService
  ) {}

  ngOnInit(): void {
    this.fetchEvents();
  }

  fetchEvents(): void {
    this.loading = true;
    this.eventService.getEvents(this.locationQuery, undefined, this.categoryQuery).subscribe({
      next: (data) => {
        this.allEvents = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch events', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilter(): void {
    this.fetchEvents();
  }

  applyFilters(): void {
    if (this.ratingQuery > 0) {
      this.events = this.allEvents.filter(e => e.average_rating >= this.ratingQuery);
    } else {
      this.events = [...this.allEvents];
    }
    this.page = 1;
    this.displayedEvents = this.events.slice(0, this.pageSize);
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      if (this.displayedEvents.length < this.events.length) {
        this.page++;
        this.displayedEvents = this.events.slice(0, this.page * this.pageSize);
      }
    }
  }

  filterByRating(rating: number): void {
    this.ratingQuery = rating;
    this.applyFilters();
  }

  filterByTag(tag: string): void {
    this.locationQuery = tag;
    this.fetchEvents();
  }

  filterByCategory(category: string): void {
    this.categoryQuery = category;
    this.fetchEvents();
  }

  toggleLike(event: any, e: Event): void {
    e.stopPropagation();
    e.preventDefault();
    this.savedVendorService.toggleLike(event.id);
  }

  toggleSave(event: any, e: Event): void {
    e.stopPropagation();
    e.preventDefault();
    this.savedVendorService.toggleSave(event.id);
  }

  isLiked(eventId: number): boolean {
    return this.savedVendorService.isLiked(eventId);
  }

  isSaved(eventId: number): boolean {
    return this.savedVendorService.isSaved(eventId);
  }

  scrollToEvents(): void {
    const el = document.getElementById('events-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getEventImageUrl(url: string | null): string {
    if (!url) return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'WEDDING': 'Wedding Ceremony',
      'RECEPTION': 'Reception',
      'ENGAGEMENT': 'Engagement',
      'REHEARSAL': 'Rehearsal Dinner',
      'BRIDAL': 'Bridal Shower',
      'PHOTOGRAPHY': 'Photography',
      'CATERING': 'Catering',
      'DECORATION': 'Decoration',
      'MUSIC': 'Music & Entertainment',
      'OTHER': 'Celebration',
    };
    return labels[category] || 'Wedding';
  }

  share(eventToShare: any, platform: string, clickEvent: Event): void {
    clickEvent.stopPropagation();
    clickEvent.preventDefault();
    
    // Construct the URL to the detail page
    const url = window.location.origin + '/event/' + eventToShare.id;
    const text = `Check out this service on Eternally Yours: ${eventToShare.title || ''}`;
    
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.show('Link copied to clipboard!', 'info');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  }
}
