import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../../constants';
import * as AOS from 'aos';

@Component({
  selector: 'app-pilgrimage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pilgrimage.html',
  styleUrls: ['./pilgrimage.css']
})
export class PilgrimageComponent implements OnInit {
  tours: any[] = [];
  selectedTour: any = null;
  bookingForm = {
    pilgrim_name: '',
    email: '',
    phone: '',
    travel_date: '',
    passenger_count: 1,
    special_requirements: ''
  };
  bookingSuccess = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    AOS.init();
    this.loadTours();
  }

  loadTours() {
    this.http.get(`${API_BASE}/tours/tours/`).subscribe({
      next: (data: any) => {
        this.tours = data;
      },
      error: (err) => console.error('Failed to load tours', err)
    });
  }

  openBooking(tour: any) {
    this.selectedTour = tour;
    this.bookingSuccess = false;
    this.bookingForm = {
      pilgrim_name: '',
      email: '',
      phone: '',
      travel_date: '',
      passenger_count: 1,
      special_requirements: ''
    };
  }

  closeBooking() {
    this.selectedTour = null;
  }

  submitBooking() {
    if (!this.selectedTour) return;
    const payload = {
      ...this.bookingForm,
      tour: this.selectedTour.id
    };

    this.http.post(`${API_BASE}/tours/bookings/`, payload).subscribe({
      next: () => {
        this.bookingSuccess = true;
        setTimeout(() => this.closeBooking(), 3000);
      },
      error: (err) => console.error('Failed to book tour', err)
    });
  }
}
