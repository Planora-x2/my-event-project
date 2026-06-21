import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { EventService } from '../../services/event/event';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-enquiry-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective],
  templateUrl: './enquiry-analytics.html',
  styleUrl: './enquiry-analytics.css'
})
export class EnquiryAnalyticsComponent implements OnInit {
  enquiries: any[] = [];
  filteredEnquiries: any[] = [];
  managedEvents: any[] = [];
  
  currentUser: any = null;
  isAdmin: boolean = false;
  
  // Filters
  selectedEventId: string = '';
  selectedClientId: string = '';
  dateRange: string = 'all'; // 'all', 'today', 'week', 'month'

  // Chart configs
  public chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(44,24,16,0.05)' }, ticks: { color: '#8C7B72' } },
      y: { grid: { color: 'rgba(44,24,16,0.05)' }, ticks: { color: '#8C7B72' } }
    }
  };

  public donutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: {
      duration: 2500,
      easing: 'easeOutExpo',
      animateScale: true,
      animateRotate: true
    },
    plugins: { 
      legend: { position: 'right', labels: { color: '#8C7B72', font: { family: 'Lora' } } } 
    }
  };

  public enquiryByEventChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Enquiries', backgroundColor: '#AEC6CF', borderRadius: 6, maxBarThickness: 40 }]
  };

  public enquiryByTypeChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Logged In Users', 'Unknown Users'],
    datasets: [{ data: [0, 0], label: 'Enquiries', backgroundColor: ['#CBAACB', '#B0E0E6'], hoverOffset: 8, borderWidth: 2, borderColor: '#fff' }]
  };

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.role === 'ADMIN';
        this.loadInitialData();
      }
    });
  }

  loadInitialData() {
    // If admin, they could technically filter by client, but for simplicity, we load all events or let them filter.
    this.eventService.getEvents(undefined, this.isAdmin ? undefined : 'me').subscribe(events => {
      this.managedEvents = events;
    });

    this.loadEnquiries();
  }

  loadEnquiries() {
    this.eventService.getEnquiries(this.selectedClientId, this.selectedEventId).subscribe(data => {
      this.enquiries = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    let result = this.enquiries;

    // Filter by Event
    if (this.selectedEventId) {
      result = result.filter(e => e.event === parseInt(this.selectedEventId, 10));
    }

    // Filter by Date
    if (this.dateRange !== 'all') {
      const now = new Date();
      let thresholdDate = new Date();
      
      if (this.dateRange === 'today') {
        thresholdDate.setHours(0, 0, 0, 0);
      } else if (this.dateRange === 'week') {
        thresholdDate.setDate(now.getDate() - 7);
      } else if (this.dateRange === 'month') {
        thresholdDate.setMonth(now.getMonth() - 1);
      }
      
      result = result.filter(e => new Date(e.created_at) >= thresholdDate);
    }

    this.filteredEnquiries = result;
    this.updateCharts();
  }

  updateCharts() {
    // Bar Chart: Enquiries per event
    const eventCounts: { [key: string]: number } = {};
    let loggedInCount = 0;
    let unknownCount = 0;

    this.filteredEnquiries.forEach(eq => {
      // For event counts
      const title = eq.event_details?.title || `Event #${eq.event}`;
      eventCounts[title] = (eventCounts[title] || 0) + 1;

      // For type counts
      if (eq.user) {
        loggedInCount++;
      } else {
        unknownCount++;
      }
    });

    this.enquiryByEventChartData = {
      labels: Object.keys(eventCounts),
      datasets: [{ 
        data: Object.keys(eventCounts).map(k => eventCounts[k]), 
        label: 'Enquiries', 
        backgroundColor: '#AEC6CF', 
        borderRadius: 6 
      }]
    };

    this.enquiryByTypeChartData = {
      labels: ['Logged In Users', 'Unknown Users'],
      datasets: [{ 
        data: [loggedInCount, unknownCount], 
        label: 'Enquiries', 
        backgroundColor: ['#CBAACB', '#B0E0E6'], 
        hoverOffset: 8, 
        borderWidth: 2, 
        borderColor: '#fff' 
      }]
    };

    this.cdr.detectChanges();
  }

  getTotalEnquiries(): number {
    return this.filteredEnquiries.length;
  }
}
