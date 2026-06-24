import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../constants';
import { WeddingCard, Venue } from '../../models/wedding-card.model';

@Injectable({
  providedIn: 'root'
})
export class WeddingCardService {
  private apiUrl = `${API_BASE}/api/events/wedding-cards/`;
  private venuesUrl = `${API_BASE}/api/events/venues/`;

  constructor(private http: HttpClient) {}

  getVenues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(this.venuesUrl);
  }

  getMyCards(): Observable<WeddingCard[]> {
    return this.http.get<WeddingCard[]>(this.apiUrl);
  }

  getCardById(id: string): Observable<WeddingCard> {
    return this.http.get<WeddingCard>(`${this.apiUrl}${id}/`);
  }

  createCard(card: WeddingCard): Observable<WeddingCard> {
    const formData = new FormData();
    Object.keys(card).forEach(key => {
      const value = (card as any)[key];
      if (value !== null && value !== undefined) {
        if (key === 'cover_image' && value instanceof File) {
          formData.append(key, value, value.name);
        } else {
          formData.append(key, value);
        }
      }
    });
    return this.http.post<WeddingCard>(this.apiUrl, formData);
  }

  updateCard(id: string, card: WeddingCard): Observable<WeddingCard> {
    return this.http.put<WeddingCard>(`${this.apiUrl}${id}/`, card);
  }

  deleteCard(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

  submitRSVP(id: string, rsvpData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}${id}/rsvp/`, rsvpData);
  }
}
