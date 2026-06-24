import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${API_BASE}/api/events`;

  constructor(private http: HttpClient) { }

  getEvents(location?: string, clientId?: string, category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (location) {
      params = params.set('location', location);
    }
    if (clientId) {
      params = params.set('client', clientId);
    }
    if (category && category !== 'ALL') {
      params = params.set('category', category);
    }
    return this.http.get<any[]>(`${this.apiUrl}/events/`, { params });
  }

  getEventById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/events/${id}/`);
  }

  addEvent(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/events/`, formData);
  }

  updateEvent(id: number, formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/events/${id}/`, formData);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/events/${id}/`);
  }

  getVenues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/venues/`);
  }

  addVenue(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/venues/`, formData);
  }

  updateVenue(id: number, formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/venues/${id}/`, formData);
  }

  deleteVenue(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/venues/${id}/`);
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

  rateEvent(eventId: number, stars: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/events/${eventId}/rate/`, { stars });
  }

  trackEnquiry(eventId: number, name?: string, mobileNumber?: string): Observable<any> {
    const payload = { name, mobile_number: mobileNumber };
    return this.http.post<any>(`${this.apiUrl}/events/${eventId}/track_enquiry/`, payload);
  }

  getEnquiries(clientId?: string, eventId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('client', clientId);
    if (eventId) params = params.set('event', eventId);
    return this.http.get<any[]>(`${this.apiUrl}/enquiries/`, { params });
  }

  acceptEnquiry(enquiryId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/enquiries/${enquiryId}/accept/`, {});
  }

  completeEnquiry(enquiryId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/enquiries/${enquiryId}/complete/`, {});
  }

  reenquire(enquiryId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/enquiries/${enquiryId}/reenquire/`, {});
  }
}
