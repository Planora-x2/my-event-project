import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { EventService } from '../../services/event/event';
import { ChartConfiguration } from 'chart.js';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-client-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule],
  templateUrl: './client-analytics.html',
  styleUrl: './client-analytics.css',
})
export class ClientAnalyticsComponent implements OnInit {
  managedEvents: any[] = [];
  bookings: any[] = [];

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
  
  public eventChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Tickets Sold', backgroundColor: '#AEC6CF', borderRadius: 6, maxBarThickness: 25 }]
  };

  public venueChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Bookings by Venue', backgroundColor: '#CBAACB', borderRadius: 6, maxBarThickness: 25 }]
  };

  public revenueByEventChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Revenue ($)', backgroundColor: ['#AEC6CF', '#CBAACB', '#B0E0E6', '#E6E6FA', '#D8BFD8', '#F5E6E6', '#E8DCC4'], hoverOffset: 8, borderWidth: 2, borderColor: '#fff' }]
  };

  public revenueByVenueChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Revenue ($)', backgroundColor: ['#CBAACB', '#AEC6CF', '#D8BFD8', '#B0E0E6', '#E6E6FA', '#F5E6E6', '#E8DCC4'], hoverOffset: 8, borderWidth: 2, borderColor: '#fff' }]
  };

  constructor(private eventService: EventService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.eventService.getEvents(undefined, 'me').subscribe(events => {
      this.managedEvents = events.map(e => ({ ...e, ticketsSold: 0, revenue: 0 }));
      this.loadBookings();
    });
  }

  loadBookings() {
    this.eventService.getClientBookings().subscribe(b => {
      this.bookings = b;
      this.calculateStats();
    });
  }

  calculateStats() {
    const eventStats: any = {};
    const venueStats: any = {};

    this.bookings.forEach(booking => {
      const eventId = booking.event;
      const venueName = booking.event_details.venue_details.name;
      const tickets = booking.tickets;
      const rev = tickets * parseFloat(booking.event_details.price);

      if (!eventStats[eventId]) eventStats[eventId] = { tickets: 0, revenue: 0 };
      eventStats[eventId].tickets += tickets;
      eventStats[eventId].revenue += rev;

      if (!venueStats[venueName]) venueStats[venueName] = { tickets: 0, revenue: 0 };
      venueStats[venueName].tickets += tickets;
      venueStats[venueName].revenue += rev;
    });

    this.managedEvents.forEach(e => {
      if (eventStats[e.id]) {
        e.ticketsSold = eventStats[e.id].tickets;
        e.revenue = eventStats[e.id].revenue;
      }
    });

    this.eventChartData = {
      labels: this.managedEvents.map(e => e.title),
      datasets: [{ data: this.managedEvents.map(e => e.ticketsSold), label: 'Tickets Sold', backgroundColor: '#AEC6CF', borderRadius: 6 }]
    };

    this.venueChartData = {
      labels: Object.keys(venueStats),
      datasets: [{ data: Object.keys(venueStats).map(k => venueStats[k].tickets), label: 'Bookings by Venue', backgroundColor: '#CBAACB', borderRadius: 6 }]
    };

    this.revenueByEventChartData = {
      labels: this.managedEvents.map(e => e.title),
      datasets: [{ data: this.managedEvents.map(e => e.revenue), label: 'Revenue ($)', backgroundColor: ['#AEC6CF', '#CBAACB', '#B0E0E6', '#E6E6FA', '#D8BFD8', '#F5E6E6', '#E8DCC4'] }]
    };

    this.revenueByVenueChartData = {
      labels: Object.keys(venueStats),
      datasets: [{ data: Object.keys(venueStats).map(k => venueStats[k].revenue), label: 'Revenue ($)', backgroundColor: ['#CBAACB', '#AEC6CF', '#D8BFD8', '#B0E0E6', '#E6E6FA', '#F5E6E6', '#E8DCC4'] }]
    };
    
    if (this.cdr) {
      this.cdr.detectChanges();
    }
  }
}
