import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
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

  // Chart Configuration
  selectedDataSource: 'users' | 'events' | 'bookings' = 'users';
  selectedChartType: ChartType = 'pie';
  
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [] }]
  };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  chartReady: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
    this.loadEvents();
    this.loadBookings();
  }

  // Called when all data is loaded or when user changes dropdowns
  generateChart() {
    let labels: string[] = [];
    let dataCounts: number[] = [];
    let backgroundColors: string[] = ['#D4AF37', '#2C1810', '#8A9A5B', '#C8956C', '#F5E6D3', '#A47551', '#4A5D23'];

    if (this.selectedDataSource === 'users') {
      // Group users by role
      const roles: Record<string, number> = {};
      this.users.forEach(u => {
        const role = u.role || 'UNKNOWN';
        roles[role] = (roles[role] || 0) + 1;
      });
      labels = Object.keys(roles);
      dataCounts = Object.values(roles);
      
    } else if (this.selectedDataSource === 'events') {
      // Group events by category
      const categories: Record<string, number> = {};
      this.events.forEach(e => {
        const cat = e.category || 'UNKNOWN';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      labels = Object.keys(categories);
      dataCounts = Object.values(categories);

    } else if (this.selectedDataSource === 'bookings') {
      // Group bookings by status
      const statuses: Record<string, number> = {};
      this.bookings.forEach(b => {
        const status = b.status || 'UNKNOWN';
        statuses[status] = (statuses[status] || 0) + 1;
      });
      labels = Object.keys(statuses);
      dataCounts = Object.values(statuses);
    }

    this.chartData = {
      labels: labels,
      datasets: [
        { 
          data: dataCounts,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: 'transparent'
        }
      ]
    };
    this.chartReady = true;
  }

  loadUsers() {
    this.http.get<any[]>(`${this.apiUrl}/admin/users/`).subscribe({
      next: (data) => {
        this.users = data;
        this.totalOrganisers = this.users.filter(u => u.role === 'CLIENT').length;
        this.checkInitialChart();
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  loadEvents() {
    this.http.get<any[]>(`${this.apiUrl}/events/events/`).subscribe({
      next: (data) => {
        this.events = data;
        this.checkInitialChart();
      },
      error: (err) => console.error('Failed to load events', err)
    });
  }

  loadBookings() {
    this.http.get<any[]>(`${this.apiUrl}/events/bookings/`).subscribe({
      next: (data) => {
        this.bookings = data;
        this.calculateRevenue();
        this.checkInitialChart();
      },
      error: (err) => console.error('Failed to load bookings', err)
    });
  }

  private loadedCount = 0;
  checkInitialChart() {
    this.loadedCount++;
    if (this.loadedCount === 3) {
      this.generateChart();
    }
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
