import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { ChatbotComponent } from './components/chatbot/chatbot';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private router = inject(Router);

  // Generate 40 flowers with random positions, delays, durations, and types
  flowers = Array(40).fill(0).map(() => {
    const emojis = ['🌸', '💮', '✨', '🤍', '✦'];
    return {
      left: Math.random() * 100,
      duration: 6 + Math.random() * 6, // Fall slowly (6 to 12s)
      delay: Math.random() * 5,
      type: emojis[Math.floor(Math.random() * emojis.length)],
      size: 0.8 + Math.random() * 1.2
    };
  });

  ngOnInit() {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      offset: 50,
      delay: 50,
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => AOS.refresh(), 100);
      }
    });
  }
}
