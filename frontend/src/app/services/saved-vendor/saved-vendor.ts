import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { API_BASE } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class SavedVendorService {
  private likedEventsSubject = new BehaviorSubject<number[]>([]);
  private savedEventsSubject = new BehaviorSubject<number[]>([]);

  likedEvents$ = this.likedEventsSubject.asObservable();
  savedEvents$ = this.savedEventsSubject.asObservable();

  private isLoggedIn = false;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        this.fetchBackendData();
      } else {
        this.likedEventsSubject.next(this.getLocalLiked());
        this.savedEventsSubject.next(this.getLocalSaved());
      }
    });
  }

  private fetchBackendData(): void {
    this.http.get<number[]>(`${API_BASE}/api/interactions/likes/`).subscribe({
      next: (ids) => this.likedEventsSubject.next(ids),
      error: (err) => console.error(err)
    });
    this.http.get<number[]>(`${API_BASE}/api/interactions/saves/`).subscribe({
      next: (ids) => this.savedEventsSubject.next(ids),
      error: (err) => console.error(err)
    });
  }

  private getLocalLiked(): number[] {
    const data = localStorage.getItem('eternally_yours_liked');
    return data ? JSON.parse(data) : [];
  }

  private getLocalSaved(): number[] {
    const data = localStorage.getItem('eternally_yours_saved');
    return data ? JSON.parse(data) : [];
  }

  getLikedEvents(): number[] {
    return this.likedEventsSubject.value;
  }

  getSavedEvents(): number[] {
    return this.savedEventsSubject.value;
  }

  toggleLike(eventId: number): void {
    let current = this.likedEventsSubject.value;
    const isCurrentlyLiked = current.includes(eventId);
    
    if (isCurrentlyLiked) {
      current = current.filter(id => id !== eventId);
    } else {
      current = [...current, eventId];
    }
    this.likedEventsSubject.next(current);

    if (this.isLoggedIn) {
      this.http.post(`${API_BASE}/api/interactions/likes/`, { event_id: eventId }).subscribe({
        error: () => this.fetchBackendData()
      });
    } else {
      localStorage.setItem('eternally_yours_liked', JSON.stringify(current));
    }
  }

  toggleSave(eventId: number): void {
    let current = this.savedEventsSubject.value;
    const isCurrentlySaved = current.includes(eventId);
    
    if (isCurrentlySaved) {
      current = current.filter(id => id !== eventId);
    } else {
      current = [...current, eventId];
    }
    this.savedEventsSubject.next(current);

    if (this.isLoggedIn) {
      this.http.post(`${API_BASE}/api/interactions/saves/`, { event_id: eventId }).subscribe({
        error: () => this.fetchBackendData()
      });
    } else {
      localStorage.setItem('eternally_yours_saved', JSON.stringify(current));
    }
  }

  isLiked(eventId: number): boolean {
    return this.likedEventsSubject.value.includes(eventId);
  }

  isSaved(eventId: number): boolean {
    return this.savedEventsSubject.value.includes(eventId);
  }
}
