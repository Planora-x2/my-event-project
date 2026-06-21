import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '../../services/event/event';
import { AuthService } from '../../services/auth/auth';
import { InteractionService } from '../../services/interaction/interaction';
import { ToastService } from '../../services/toast/toast';
import { SavedVendorService } from '../../services/saved-vendor/saved-vendor';
import { API_BASE } from '../../constants';
import * as L from 'leaflet';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetailComponent implements OnInit, OnDestroy {
  event: any = null;
  loading: boolean = true;
  userRating: number = 0;
  map: L.Map | null = null;

  // Interaction State
  currentUser: any = null;
  isOrganizer: boolean = false;
  
  comments: any[] = [];
  newComment: string = '';
  
  chatMessages: any[] = [];
  newChatMessage: string = '';
  chatRoomName: string = '';
  isChatOpen: boolean = false;
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private interactionService: InteractionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    public authService: AuthService,
    private savedVendorService: SavedVendorService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
      this.checkRoleAndInitialize();
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadEvent(id);
      }
    });
  }

  ngOnDestroy() {
    this.interactionService.disconnectChat();
  }

  checkRoleAndInitialize() {
    if (this.event && this.currentUser) {
      this.isOrganizer = (this.event.client === this.currentUser.id);
      if (!this.isOrganizer) {
        this.initializeChat();
      }
    }
  }

  loadEvent(id: string) {
    this.loading = true;
    this.eventService.getEventById(id).subscribe({
      next: (data) => {
        if (data.price && typeof data.price === 'string') {
          data.price = parseFloat(data.price);
        }
        this.event = data;
        this.loading = false;
        
        if (this.event.current_user_rating) {
          this.userRating = this.event.current_user_rating;
        }
        
        this.loadComments();
        this.checkRoleAndInitialize();
        
        this.cdr.detectChanges();
        
        if (this.event.latitude && this.event.longitude) {
          setTimeout(() => this.initMap(), 100);
        }
      },
      error: (err) => {
        console.error('Failed to load event details', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getEventImageUrl(url: string | null): string {
    if (!url) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  }

  initMap() {
    if (this.map) {
      this.map.remove();
    }
    const lat = this.event.latitude;
    const lng = this.event.longitude;
    
    this.map = L.map('event-map').setView([lat, lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Use default icon
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    L.marker([lat, lng], { icon }).addTo(this.map)
      .bindPopup(this.event.title)
      .openPopup();
      
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  rateEvent(stars: number) {
    if (!this.currentUser) {
      this.toastService.show('Please log in to rate this event.', 'warning');
      return;
    }
    this.eventService.rateEvent(this.event.id, stars).subscribe({
      next: (res) => {
        this.userRating = stars;
        this.event.average_rating = (this.event.average_rating || 0); // Mock update, or reload event
        this.loadEvent(this.event.id); // Reload event to get new average
        this.toastService.show('Thank you for your rating!', 'info');
      },
      error: (err) => {
        this.toastService.show('Failed to submit rating.', 'warning');
        console.error(err);
      }
    });
  }

  // --- COMMENTS ---
  loadComments() {
    if (!this.event) return;
    this.interactionService.getComments(this.event.id).subscribe(comments => {
      this.comments = comments;
      this.cdr.detectChanges();
    });
  }

  postComment() {
    if (!this.currentUser) {
      this.toastService.show('Please login to participate in the discussion.', 'warning');
      return;
    }
    if (!this.newComment.trim() || !this.event) return;

    this.interactionService.postComment(this.event.id, this.newComment).subscribe({
      next: (comment) => {
        // Prepend because we sort by -created_at
        this.comments.unshift(comment);
        this.newComment = '';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to post comment', err)
    });
  }

  // --- LIVE CHAT ---
  initializeChat() {
    if (!this.currentUser || !this.event) return;

    // Room name specific to event and current user (attendee)
    this.chatRoomName = `chat_event_${this.event.id}_user_${this.currentUser.id}`;

    // Fetch history
    this.interactionService.getMessages(this.chatRoomName).subscribe(messages => {
      this.chatMessages = messages;
      this.scrollToBottom();
      this.cdr.detectChanges();
    });

    // Connect WebSocket
    this.interactionService.connectToChat(this.chatRoomName, (msg) => {
      this.chatMessages.push(msg);
      this.scrollToBottom();
      this.cdr.detectChanges();
    });
  }

  sendChatMessage() {
    if (!this.currentUser) {
      this.toastService.show('Please login to chat with the organizer.', 'warning');
      return;
    }
    if (!this.newChatMessage.trim() || !this.event) return;

    // Send via REST (it will be broadcasted to WebSocket by backend)
    this.interactionService.sendMessage(this.chatRoomName, this.newChatMessage, this.event.client).subscribe({
      next: () => {
        this.newChatMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to send message', err)
    });
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.trackEnquiry();
      this.scrollToBottom();
    }
  }

  trackEnquiry() {
    if (this.event) {
      this.eventService.trackEnquiry(this.event.id).subscribe({
        next: (res) => {
          this.event.enquiry_count = res.enquiry_count;
        },
        error: (err) => console.error('Failed to track enquiry', err)
      });
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.chatScrollContainer) {
          this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
        }
      } catch (err) { }
    }, 100);
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'WEDDING': 'Wedding Ceremony',
      'RECEPTION': 'Reception',
      'ENGAGEMENT': 'Engagement',
      'REHEARSAL': 'Rehearsal Dinner',
      'BRIDAL': 'Bridal Shower',
      'PHOTOGRAPHY': 'Photography',
      'CATERING': 'Catering',
      'DECORATION': 'Decoration',
      'MUSIC': 'Music & Entertainment',
      'OTHER': 'Celebration',
    };
    return labels[category] || 'Wedding Celebration';
  }

  // --- GALLERY LIGHTBOX ---
  selectedGalleryIndex: number | null = null;

  openLightbox(index: number) {
    this.selectedGalleryIndex = index;
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  closeLightbox() {
    this.selectedGalleryIndex = null;
    document.body.style.overflow = '';
  }

  nextPhoto() {
    if (!this.event || !this.event.gallery_images || this.selectedGalleryIndex === null) return;
    if (this.selectedGalleryIndex < this.event.gallery_images.length - 1) {
      this.selectedGalleryIndex++;
    } else {
      this.selectedGalleryIndex = 0; // Wrap around
    }
  }

  prevPhoto() {
    if (!this.event || !this.event.gallery_images || this.selectedGalleryIndex === null) return;
    if (this.selectedGalleryIndex > 0) {
      this.selectedGalleryIndex--;
    } else {
      this.selectedGalleryIndex = this.event.gallery_images.length - 1; // Wrap around
    }
  }

  // --- GALLERY UPLOAD (Organizer) ---
  selectedGalleryFile: File | null = null;
  newGalleryCaption: string = '';
  isUploadingGallery: boolean = false;

  onGalleryFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedGalleryFile = event.target.files[0];
    }
  }

  uploadGalleryPhoto() {
    if (!this.selectedGalleryFile || !this.event || !this.isOrganizer) return;
    
    this.isUploadingGallery = true;
    const formData = new FormData();
    formData.append('image', this.selectedGalleryFile);
    if (this.newGalleryCaption.trim()) {
      formData.append('caption', this.newGalleryCaption.trim());
    }

    this.eventService.uploadGalleryImage(this.event.id, formData).subscribe({
      next: (newImage) => {
        if (!this.event.gallery_images) {
          this.event.gallery_images = [];
        }
        this.event.gallery_images.unshift(newImage);
        
        this.selectedGalleryFile = null;
        this.newGalleryCaption = '';
        this.isUploadingGallery = false;
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        this.cdr.detectChanges();
        this.toastService.show('Gallery photo uploaded successfully!', 'info');
      },
      error: (err) => {
        console.error('Failed to upload gallery image', err);
        this.toastService.show('Failed to upload photo. Please try again.', 'warning');
        this.isUploadingGallery = false;
        this.cdr.detectChanges();
      }
    });
  }

  share(platform: string) {
    const url = window.location.href;
    const text = `Check out this service on Eternally Yours: ${this.event?.title || ''}`;
    
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.show('Link copied to clipboard!', 'info');
      });
    }
  }

  toggleLike(): void {
    if (this.event) {
      this.savedVendorService.toggleLike(this.event.id);
    }
  }

  toggleSave(): void {
    if (this.event) {
      this.savedVendorService.toggleSave(this.event.id);
    }
  }

  isLiked(): boolean {
    return this.event ? this.savedVendorService.isLiked(this.event.id) : false;
  }

  isSaved(): boolean {
    return this.event ? this.savedVendorService.isSaved(this.event.id) : false;
  }
}
