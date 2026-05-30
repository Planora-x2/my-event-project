import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  currentUser$: Observable<any>;
  isScrolled = false;

  constructor(public authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
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
    return `http://localhost:8000${url}`;
  }

  isThemeSelectorOpen = false;
  availableThemes = ['rose', 'mint', 'lavender', 'gold', 'ocean', 'ruby', 'emerald', 'sapphire'];
  availableFonts = ['classic', 'modern', 'playful'];
  availableLooks = ['elegant', 'minimal', 'bold'];

  openThemeSelector() {
    this.isThemeSelectorOpen = true;
  }

  closeThemeSelector() {
    this.isThemeSelectorOpen = false;
  }

  setTheme(theme: string, user: any) {
    if (!user) return;
    this.authService.updateThemePreferences(theme, user.is_dark_mode, user.theme_font, user.theme_look).subscribe();
  }

  setFont(font: string, user: any) {
    if (!user) return;
    this.authService.updateThemePreferences(user.theme_color, user.is_dark_mode, font, user.theme_look).subscribe();
  }

  setLook(look: string, user: any) {
    if (!user) return;
    this.authService.updateThemePreferences(user.theme_color, user.is_dark_mode, user.theme_font, look).subscribe();
  }

  toggleDarkMode(event: any, user: any) {
    if (!user) return;
    this.authService.updateThemePreferences(user.theme_color, event.target.checked, user.theme_font, user.theme_look).subscribe();
  }
}
