import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth';
import { InteractionService } from '../../services/interaction/interaction';
import { API_BASE } from '../../constants';

@Component({
  selector: 'app-support-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-chat.html',
  styleUrl: './support-chat.css'
})
export class SupportChatComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  isAdmin: boolean = false;
  
  // Admin View State
  clients: any[] = [];
  selectedClient: any = null;
  
  // Chat State
  chatRoomName: string = '';
  chatMessages: any[] = [];
  newChatMessage: string = '';
  
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private interactionService: InteractionService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.role === 'ADMIN';
        if (this.isAdmin) {
          this.loadClients();
        } else if (user.role === 'CLIENT') {
          // Auto select self for clients
          this.selectClient(user);
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.interactionService.disconnectChat();
  }

  loadClients() {
    this.http.get<any[]>(`${API_BASE}/api/admin/users/`).subscribe({
      next: (users) => {
        this.clients = users.filter(u => u.role === 'CLIENT');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load clients', err)
    });
  }

  selectClient(client: any) {
    this.selectedClient = client;
    const clientId = client.pk || client.id;
    this.chatRoomName = `support_${clientId}`;
    
    // Disconnect any existing chat
    this.interactionService.disconnectChat();
    
    // Load historical messages
    this.interactionService.getMessages(this.chatRoomName).subscribe({
      next: (msgs) => {
        this.chatMessages = msgs;
        this.scrollToBottom();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load chat history', err)
    });

    // Connect WebSocket
    this.interactionService.connectToChat(this.chatRoomName, (msg) => {
      this.chatMessages.push(msg);
      this.scrollToBottom();
      this.cdr.detectChanges();
    });
  }

  sendMessage() {
    if (!this.newChatMessage.trim() || !this.selectedClient) return;

    let receiverId = undefined;
    if (this.isAdmin && this.selectedClient) {
      receiverId = this.selectedClient.pk || this.selectedClient.id;
    }

    this.interactionService.sendMessage(this.chatRoomName, this.newChatMessage, receiverId).subscribe({
      next: () => {
        this.newChatMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to send message', err)
    });
  }

  getProfilePicUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
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
}
