import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth/auth';
import { API_BASE } from '../../constants';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit {
  currentUser$: Observable<any>;
  isScrolled = false;
  notifications: any[] = [];
  unreadCount = 0;
  isNotificationsOpen = false;

  constructor(public authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  ngOnInit() {
    this.currentUser$.subscribe(user => {
      if (user && (user.role === 'CLIENT' || user.role === 'ADMIN')) {
        this.fetchNotifications();
      }
    });
  }

  fetchNotifications() {
    this.authService.getNotifications().subscribe(data => {
      this.notifications = data;
      this.unreadCount = this.notifications.filter(n => !n.is_read).length;
    });
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  markAsRead(notification: any) {
    if (!notification.is_read) {
      this.authService.markNotificationAsRead(notification.id).subscribe(() => {
        notification.is_read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
      this.isNotificationsOpen = false;
    }
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.authService.updateProfilePicture(file).subscribe({
        next: (user) => {
          event.target.value = '';
        },
        error: (err) => console.error('Failed to update profile picture', err)
      });
    }
  }

  getProfilePicUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  }

  toggleDarkModeDirect(user: any) {
    if (!user) return;
    this.authService.updateThemePreferences(user.theme_color, !user.is_dark_mode, user.theme_font, user.theme_look, user.background_effect).subscribe();
  }
}
