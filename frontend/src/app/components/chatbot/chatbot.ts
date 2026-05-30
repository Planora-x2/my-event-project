import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InteractionService } from '../../services/interaction/interaction';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  images?: string[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})
export class ChatbotComponent implements OnInit {
  isOpen: boolean = false;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isTyping: boolean = false;

  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  constructor(
    private interactionService: InteractionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initial greeting
    setTimeout(() => {
      this.messages.push({
        text: "Hi there! I'm your AI Wedding Assistant. Need help finding a venue or checking prices?",
        sender: 'bot',
        timestamp: new Date()
      });
      this.cdr.detectChanges();
    }, 1000);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.scrollToBottom();
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userText = this.newMessage;
    this.messages.push({
      text: userText,
      sender: 'user',
      timestamp: new Date()
    });
    
    this.newMessage = '';
    this.isTyping = true;
    this.scrollToBottom();

    // Call backend
    this.interactionService.sendToAI(userText).subscribe({
      next: (res) => {
        // Simulate a slight typing delay for realism
        setTimeout(() => {
          this.isTyping = false;
          this.messages.push({
            text: res.response || "I'm not sure, but I can help you find out!",
            sender: 'bot',
            timestamp: new Date(),
            images: res.images || []
          });
          this.scrollToBottom();
          this.cdr.detectChanges();
        }, 800);
      },
      error: (err) => {
        console.error('Chat AI Error:', err);
        this.isTyping = false;
        this.messages.push({
          text: "Oops, I'm having trouble connecting to my brain right now. Please try again later!",
          sender: 'bot',
          timestamp: new Date()
        });
        this.scrollToBottom();
        this.cdr.detectChanges();
      }
    });
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
