import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  events: any[] = [];
  bookings: any[] = [];
  
  totalRevenue = 0;
  totalOrganisers = 0;

  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
    this.loadEvents();
    this.loadBookings();
  }

  loadUsers() {
    this.http.get<any[]>(`${this.apiUrl}/admin/users/`).subscribe({
      next: (data) => {
        this.users = data;
        this.totalOrganisers = this.users.filter(u => u.role === 'CLIENT').length;
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  loadEvents() {
    this.http.get<any[]>(`${this.apiUrl}/events/events/`).subscribe({
      next: (data) => {
        this.events = data;
      },
      error: (err) => console.error('Failed to load events', err)
    });
  }

  loadBookings() {
    this.http.get<any[]>(`${this.apiUrl}/events/bookings/`).subscribe({
      next: (data) => {
        this.bookings = data;
        this.calculateRevenue();
      },
      error: (err) => console.error('Failed to load bookings', err)
    });
  }

  calculateRevenue() {
    this.totalRevenue = this.bookings.reduce((sum, booking) => {
      const tickets = booking.tickets || 0;
      const price = parseFloat(booking.event_details?.price || '0');
      return sum + (tickets * price);
    }, 0);
  }

  deleteUser(userId: number) {
    if (confirm('Are you sure you want to completely delete this user and all their data?')) {
      this.http.delete(`${this.apiUrl}/admin/users/${userId}/`).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  deleteEvent(eventId: number) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.http.delete(`${this.apiUrl}/events/events/${eventId}/`).subscribe(() => {
        this.loadEvents();
      });
    }
  }

  deleteBooking(bookingId: number) {
    if (confirm('Are you sure you want to cancel and delete this booking?')) {
      this.http.delete(`${this.apiUrl}/events/bookings/${bookingId}/`).subscribe(() => {
        this.loadBookings();
      });
    }
  }
}
