import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InteractionService } from '../../services/interaction/interaction';

interface ChatMessage {
  text: string;
  isUser: boolean;
  time: Date;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrls: ['./ai-assistant.css']
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: ChatMessage[] = [
    { text: "Hello! I'm your AI Event Planning Assistant. I can help you brainstorm themes, find the right vendors, and create a perfect timeline for your special day. How can I assist you today?", isUser: false, time: new Date() }
  ];
  newMessage = '';
  isProcessing = false;

  constructor(private interactionService: InteractionService, private cdr: ChangeDetectorRef) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isProcessing) return;

    const userText = this.newMessage;
    this.messages.push({ text: userText, isUser: true, time: new Date() });
    this.newMessage = '';
    this.isProcessing = true;

    this.interactionService.sendToAI(userText).subscribe({
      next: (res) => {
        this.messages.push({ text: res.response || "I'm sorry, I didn't understand that.", isUser: false, time: new Date() });
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ text: "Sorry, I'm having trouble connecting right now. Please try again later.", isUser: false, time: new Date() });
        this.isProcessing = false;
        this.cdr.detectChanges();
      }
    });
  }
}
