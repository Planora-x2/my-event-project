import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { ToastComponent } from './components/toast/toast';
import { AuthService } from './services/auth/auth';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ChatbotComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private router = inject(Router);
  private authService = inject(AuthService);

  isPilgrimRoute = false;
  effect = 'none';

  flowers = Array(40).fill(0).map(() => ({
    left: Math.random() * 100,
    duration: 6 + Math.random() * 6,
    delay: Math.random() * 5,
    type: ['🌸', '💮', '✨', '🤍', '✦'][Math.floor(Math.random() * 5)],
    size: 0.8 + Math.random() * 1.2
  }));

  raindrops = Array(75).fill(0).map(() => ({
    left: Math.random() * 100,
    duration: 0.6 + Math.random() * 1.5,
    delay: Math.random() * 2
  }));

  snowflakes = Array(60).fill(0).map(() => ({
    left: Math.random() * 100,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 4,
    size: 0.3 + Math.random() * 0.7
  }));

  confetti = Array(80).fill(0).map(() => ({
    left: Math.random() * 100,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    color: ['#D4AF37', '#9C4A5B', '#4A8C68', '#2B4C7E', '#C8956C'][Math.floor(Math.random() * 5)],
    size: 0.5 + Math.random() * 1
  }));

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.background_effect) {
        this.effect = user.background_effect;
      } else {
        this.effect = 'none'; // Default for unauthenticated or no preference
      }
    });

    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      offset: 50,
      delay: 50,
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isPilgrimRoute = event.urlAfterRedirects.startsWith('/pilgrimage');
        setTimeout(() => AOS.refresh(), 100);
      }
    });
  }
}
