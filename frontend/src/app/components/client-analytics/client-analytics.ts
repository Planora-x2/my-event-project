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
  public chartOptions: ChartConfiguration<'bar'>['options'] = { responsive: true };
  
  public eventChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Tickets Sold', backgroundColor: '#8a2be2' }]
  };

  public venueChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Tickets Sold by Venue', backgroundColor: '#00d2ff' }]
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

      if (!venueStats[venueName]) venueStats[venueName] = 0;
      venueStats[venueName] += tickets;
    });

    this.managedEvents.forEach(e => {
      if (eventStats[e.id]) {
        e.ticketsSold = eventStats[e.id].tickets;
        e.revenue = eventStats[e.id].revenue;
      }
    });

    this.eventChartData = {
      labels: this.managedEvents.map(e => e.title),
      datasets: [{ data: this.managedEvents.map(e => e.ticketsSold), label: 'Tickets Sold', backgroundColor: '#8a2be2' }]
    };

    this.venueChartData = {
      labels: Object.keys(venueStats),
      datasets: [{ data: Object.values(venueStats) as number[], label: 'Tickets Sold by Venue', backgroundColor: '#00d2ff' }]
    };
    
    if (this.cdr) {
      this.cdr.detectChanges();
    }
  }
}
