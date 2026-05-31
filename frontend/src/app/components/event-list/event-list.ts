import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event/event';
import { API_BASE } from '../../constants';

@Component({
  selector: 'app-event-list',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css'
})
export class EventListComponent implements OnInit {
  events: any[] = [];
  locationQuery: string = '';
  categoryQuery: string = 'ALL';
  loading: boolean = true;

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchEvents();
  }

  fetchEvents(): void {
    this.loading = true;
    this.eventService.getEvents(this.locationQuery, undefined, this.categoryQuery).subscribe({
      next: (data) => {
        this.events = data;
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

  filterByTag(tag: string): void {
    this.locationQuery = tag;
    this.fetchEvents();
  }

  filterByCategory(category: string): void {
    this.categoryQuery = category;
    this.fetchEvents();
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
}
