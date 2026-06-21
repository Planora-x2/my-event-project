import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { API_BASE } from '../../constants';

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
  subscriptions: any[] = [];
  
  totalRevenue = 0;
  totalOrganisers = 0;

  activeTab: any = 'users';
  groupedEvents: { organiserName: string; events: any[]; expanded: boolean }[] = [];

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  private apiUrl = `${API_BASE}/api`;

  // Chart Configuration
  selectedDataSource: 'users' | 'events' | 'bookings' = 'users';
  selectedChartType: ChartType = 'pie';
  
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [] }]
  };
  chartOptions: ChartConfiguration['options'] | any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // A more classic thickness
    layout: {
      padding: 20
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    elements: {
      line: {
        tension: 0.4, // Smooth flowing curves
        borderWidth: 3,
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 6,
        hoverBorderWidth: 3
      },
      bar: {
        borderRadius: 8,
        borderSkipped: false
      },
      arc: {
        borderWidth: 0, // Removes the hard lines between pie slices
        borderRadius: 4,
        hoverOffset: 12 // Makes pieces pop out dynamically on hover
      }
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: "'Montserrat', sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: { family: "'Montserrat', sans-serif", size: 14, weight: 'bold' },
        bodyFont: { family: "'Montserrat', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        usePointStyle: true,
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };
  chartReady: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
    this.loadEvents();
    this.loadBookings();
    this.loadSubscriptions();
  }

  loadSubscriptions() {
    this.http.get<any[]>(`${this.apiUrl}/users/subscriptions/`).subscribe({
      next: (data) => {
        this.subscriptions = data;
      },
      error: (err) => console.error('Failed to load subscriptions', err)
    });
  }

  updateSubscription(id: number, status: string) {
    this.http.patch(`${this.apiUrl}/users/subscriptions/${id}/`, { status }).subscribe(() => {
      this.loadSubscriptions();
    });
  }

  // Called when all data is loaded or when user changes dropdowns
  generateChart() {
    let labels: string[] = [];
    let dataCounts: number[] = [];
    let backgroundColors: string[] = ['#AEC6CF', '#CBAACB', '#B0E0E6', '#E6E6FA', '#D8BFD8', '#F5E6E6', '#E8DCC4'];

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

    // Custom gradients can be complex in pure Chart.js without canvas context,
    // so we use soft, premium semi-transparent colors for lines/bars and solid for pies.
    const isLineOrBar = this.selectedChartType === 'line' || this.selectedChartType === 'bar';

    // Show scales only for line/bar charts
    if (this.chartOptions?.scales) {
      this.chartOptions.scales['x']!.display = isLineOrBar;
      this.chartOptions.scales['y']!.display = isLineOrBar;
      
      // Make grid lines super subtle for Apple look
      if (isLineOrBar) {
        (this.chartOptions.scales['x'] as any).grid = { display: false };
        (this.chartOptions.scales['y'] as any).grid = { color: 'rgba(150, 150, 150, 0.1)' };
        (this.chartOptions.scales['x'] as any).border = { display: false };
        (this.chartOptions.scales['y'] as any).border = { display: false };
      }
    }

    this.chartData = {
      labels: labels,
      datasets: [
        { 
          data: dataCounts,
          backgroundColor: isLineOrBar ? backgroundColors.map(c => c + '40') : backgroundColors.slice(0, labels.length),
          borderColor: isLineOrBar ? backgroundColors.map(c => c) : 'transparent',
          fill: isLineOrBar ? true : false,
          borderWidth: isLineOrBar ? 3 : 0
        }
      ]
    };
    
    // Force angular to detect chart changes deeply
    this.chartOptions = { ...this.chartOptions };
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
      this.groupEvents();
    }
  }

  groupEvents() {
    const grouped = new Map<string, any[]>();
    
    this.events.forEach(event => {
      const clientUser = this.users.find(u => u.pk === event.client);
      const organiserName = clientUser ? clientUser.username : `Client #${event.client}`;
      
      if (!grouped.has(organiserName)) {
        grouped.set(organiserName, []);
      }
      grouped.get(organiserName)!.push(event);
    });

    this.groupedEvents = Array.from(grouped.entries()).map(([name, evts]) => ({
      organiserName: name,
      events: evts,
      expanded: false
    }));
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
        // The checkInitialChart is called inside loadEvents, but we might just need to regroup if already loaded
        setTimeout(() => this.groupEvents(), 100);
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
