import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { API_BASE } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${API_BASE}/api/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { 
    if (localStorage.getItem('access_token')) {
      this.getUserProfile().subscribe();
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, credentials).pipe(
      tap((res: any) => {
        console.log('Login response:', res);
        const token = res.access || res.access_token || res.key;
        if (token) {
          localStorage.setItem('access_token', token);
          if (res.refresh) localStorage.setItem('refresh_token', res.refresh);
          console.log('Token saved:', token.substring(0, 20) + '...');
        } else {
          console.error('No access token in response!', Object.keys(res));
        }
      }),
      // After token is saved, fetch user profile
      switchMap(() => this.getUserProfile())
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registration/`, userData).pipe(
      tap((res: any) => {
        const token = res.access || res.access_token || res.key;
        if (token) {
          localStorage.setItem('access_token', token);
          if (res.refresh) {
            localStorage.setItem('refresh_token', res.refresh);
          }
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    return this.http.post(`${this.apiUrl}/logout/`, {});
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/`).pipe(
      tap((user: any) => {
        this.currentUserSubject.next(user);
        if (user.theme_color) {
          this.applyThemeToDocument(user.theme_color, user.is_dark_mode, user.theme_font, user.theme_look, user.background_effect);
        }
      }),
      catchError(err => {
        this.currentUserSubject.next(null);
        throw err;
      })
    );
  }

  updateProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return this.http.patch(`${this.apiUrl}/user/`, formData).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  updateThemePreferences(themeColor: string, isDarkMode: boolean, themeFont: string, themeLook: string, backgroundEffect: string): Observable<any> {
    const payload = {
      theme_color: themeColor,
      is_dark_mode: isDarkMode,
      theme_font: themeFont,
      theme_look: themeLook,
      background_effect: backgroundEffect
    };
    return this.http.patch(`${this.apiUrl}/user/`, payload).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.applyThemeToDocument(themeColor, isDarkMode, themeFont, themeLook, backgroundEffect);
      })
    );
  }

  applyThemeToDocument(themeColor: string, isDarkMode: boolean, themeFont?: string, themeLook?: string, backgroundEffect?: string) {
    document.body.setAttribute('data-theme', themeColor);
    document.body.setAttribute('data-font', themeFont || 'classic');
    document.body.setAttribute('data-look', themeLook || 'elegant');
    document.body.setAttribute('data-effect', backgroundEffect || 'flowers');
    if (isDarkMode) {
      document.body.setAttribute('data-theme-mode', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.body.removeAttribute('data-theme-mode');
      document.body.classList.remove('dark-mode');
    }
  }
}
