import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private router = inject(Router);

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
