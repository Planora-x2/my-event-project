import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WeddingCardService } from '../../services/wedding-card/wedding-card.service';
import { WeddingCard } from '../../models/wedding-card.model';

@Component({
  selector: 'app-wedding-card-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wedding-card-view.component.html',
  styleUrls: ['./wedding-card-view.component.css']
})
export class WeddingCardViewComponent implements OnInit {
  card: WeddingCard | null = null;
  loading = true;
  error = false;
  mapUrl: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private weddingCardService: WeddingCardService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
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
}
