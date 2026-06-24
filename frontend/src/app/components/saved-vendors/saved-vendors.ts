import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SavedVendorService } from '../../services/saved-vendor/saved-vendor';
import { EventService } from '../../services/event/event';
import { PlanningService, Collection } from '../../services/planning/planning.service';
import { FormsModule } from '@angular/forms';
import { API_BASE } from '../../constants';

@Component({
  selector: 'app-saved-vendors',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './saved-vendors.html',
  styleUrl: './saved-vendors.css'
})
export class SavedVendorsComponent implements OnInit {
  activeTab: 'liked' | 'saved' | 'collections' = 'saved';
  likedEvents: any[] = [];
  savedEvents: any[] = [];
  collections: Collection[] = [];
  newCollectionTitle = '';
  loading = true;

  constructor(
    private savedVendorService: SavedVendorService,
    private eventService: EventService,
    private planningService: PlanningService
  ) {}

  ngOnInit(): void {
    this.fetchData();

    // Subscribe to changes so it updates if they unlike/unsave from here
    this.savedVendorService.likedEvents$.subscribe(() => {
      if (!this.loading) this.fetchData();
    });
    this.savedVendorService.savedEvents$.subscribe(() => {
      if (!this.loading) this.fetchData();
    });
  }

  fetchData(): void {
    this.loading = true;
    this.eventService.getEvents().subscribe({
      next: (allEvents) => {
        const likedIds = this.savedVendorService.getLikedEvents();
        const savedIds = this.savedVendorService.getSavedEvents();
        
        this.likedEvents = allEvents.filter(e => likedIds.includes(e.id));
        this.savedEvents = allEvents.filter(e => savedIds.includes(e.id));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch events', err);
        this.loading = false;
      }
    });
    this.fetchCollections();
  }

  fetchCollections(): void {
    this.planningService.getCollections().subscribe({
      next: (res) => {
        this.collections = res;
      }
    });
  }

  createCollection(): void {
    if (!this.newCollectionTitle.trim()) return;
    this.planningService.createCollection({ title: this.newCollectionTitle }).subscribe(() => {
      this.newCollectionTitle = '';
      this.fetchCollections();
    });
  }

  addToCollection(collectionId: number, eventId: number): void {
    this.planningService.addToCollection(collectionId, eventId).subscribe(() => {
      this.fetchCollections();
      alert('Added to collection!');
    });
  }

  switchTab(tab: 'liked' | 'saved' | 'collections'): void {
    this.activeTab = tab;
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

  getEventImageUrl(url: string | null): string {
    if (!url) return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'WEDDING': 'Wedding Planner',
      'RECEPTION': 'Venue',
      'ENGAGEMENT': 'Engagement',
      'REHEARSAL': 'Rehearsal',
      'BRIDAL': 'Bridal Shower',
      'PHOTOGRAPHY': 'Photography',
      'CATERING': 'Catering',
      'DECORATION': 'Decoration',
      'MUSIC': 'Music',
      'OTHER': 'Other',
    };
    return labels[category] || 'Wedding';
  }
}
