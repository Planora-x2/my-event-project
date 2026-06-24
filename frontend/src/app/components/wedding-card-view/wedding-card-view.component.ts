import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WeddingCardService } from '../../services/wedding-card/wedding-card.service';
import { WeddingCard } from '../../models/wedding-card.model';
import { ToastService } from '../../services/toast/toast';
import { AuthService } from '../../services/auth/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wedding-card-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wedding-card-view.component.html',
  styleUrls: ['./wedding-card-view.component.css']
})
export class WeddingCardViewComponent implements OnInit {
  card: WeddingCard | null = null;
  loading = true;
  error = false;
  mapUrl: SafeResourceUrl | null = null;
  isOwner = false;
  
  rsvpData = {
    guest_name: '',
    guest_email: '',
    is_attending: true,
    dietary_restrictions: ''
  };
  rsvpSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private weddingCardService: WeddingCardService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.weddingCardService.getCardById(id).subscribe({
        next: (res) => {
          this.card = res;
          this.loading = false;
          
          // Generate map URL if venue details are available
          if (this.card.is_custom_venue) {
            if (this.card.custom_venue_lat && this.card.custom_venue_lng) {
              const url = `https://maps.google.com/maps?q=${this.card.custom_venue_lat},${this.card.custom_venue_lng}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
              this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
            } else if (this.card.custom_venue_address) {
              const address = this.card.custom_venue_address;
              const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
              this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
            }
          } else if (this.card.venue_details && this.card.venue_details.address) {
            const address = `${this.card.venue_details.name}, ${this.card.venue_details.address}, ${this.card.venue_details.state}`;
            const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
            this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          }
          
          // Check ownership
          const currentUser = this.authService.getCurrentUser();
          if (currentUser && currentUser.id === this.card.user) {
            this.isOwner = true;
          }
          
          // Force UI update to fix the rendering bug
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load card', err);
          this.error = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  submitRSVP() {
    if (!this.rsvpData.guest_name || !this.rsvpData.guest_email) {
      this.toastService.show('Please provide your name and email.', 'warning');
      return;
    }
    if (this.card && this.card.id) {
      this.weddingCardService.submitRSVP(this.card.id, this.rsvpData).subscribe({
        next: (res) => {
          this.rsvpSubmitted = true;
          this.toastService.show('RSVP submitted successfully!', 'info');
          if (this.isOwner && this.card) {
             if(!this.card.rsvps) this.card.rsvps = [];
             this.card.rsvps.push(res);
          }
        },
        error: (err) => {
          this.toastService.show('Failed to submit RSVP. Try again later.', 'warning');
        }
      });
    }
  }
}
