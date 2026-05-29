import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:8000/api/events';

  constructor(private http: HttpClient) { }

  getEvents(location?: string, clientId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (location) {
      params = params.set('location', location);
    }
    if (clientId) {
      params = params.set('client', clientId);
    }
    return this.http.get<any[]>(`${this.apiUrl}/events/`, { params });
  }

  getEventById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/events/${id}/`);
  }

  addEvent(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/events/`, formData);
  }

  getVenues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/venues/`);
  }

  addVenue(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/venues/`, formData);
  }

  getClientBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings/`);
  }

  bookEvent(eventId: number, tickets: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings/`, { event: eventId, tickets: tickets });
  }

  uploadGalleryImage(eventId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/events/${eventId}/upload_gallery_image/`, formData);
  }
}
