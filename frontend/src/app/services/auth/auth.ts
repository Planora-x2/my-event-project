import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';
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
      tap(user => this.currentUserSubject.next(user)),
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
}
