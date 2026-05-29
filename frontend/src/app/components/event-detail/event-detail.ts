import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '../../services/event/event';
import { AuthService } from '../../services/auth/auth';
import { InteractionService } from '../../services/interaction/interaction';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetailComponent implements OnInit, OnDestroy {
  event: any = null;
  ticketsToBook: number = 1;
  loading: boolean = true;
  isSubmitting: boolean = false;

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
    public authService: AuthService,
    private interactionService: InteractionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
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
        
        this.loadComments();
        this.checkRoleAndInitialize();
        
        this.cdr.detectChanges();
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
    return `http://localhost:8000${url}`;
  }

  bookTickets() {
    if (!this.event) return;
    
    if (!this.currentUser) {
      alert('Please login to book tickets!');
      this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting = true;
    this.eventService.bookEvent(this.event.id, this.ticketsToBook).subscribe({
      next: () => {
        alert(`Successfully booked ${this.ticketsToBook} ticket(s) for ${this.event.title}!`);
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Booking failed', err);
        alert('Failed to book tickets. Please try again.');
        this.isSubmitting = false;
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
      alert('Please login to participate in the discussion.');
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
      alert('Please login to chat with the organizer.');
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
      this.scrollToBottom();
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
        // Add the new image to the beginning of the gallery array
        if (!this.event.gallery_images) {
          this.event.gallery_images = [];
        }
        this.event.gallery_images.unshift(newImage);
        
        // Reset form
        this.selectedGalleryFile = null;
        this.newGalleryCaption = '';
        this.isUploadingGallery = false;
        
        // Reset file input UI
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        this.cdr.detectChanges();
        alert('Gallery photo uploaded successfully!');
      },
      error: (err) => {
        console.error('Failed to upload gallery image', err);
        alert('Failed to upload photo. Please try again.');
        this.isUploadingGallery = false;
        this.cdr.detectChanges();
      }
    });
  }
}
