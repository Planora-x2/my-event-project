import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule, GoogleSigninButtonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  currentBgImage = '/assets/auth_dyn_1.png'; // default
  errorMessage = '';

  constructor(
    private socialAuthService: SocialAuthService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentBgImage = '/wedding_auth.png';

    this.socialAuthService.authState.subscribe((user) => {
      if (user) {
        console.log('Google User Logged In:', user);
        // Here we would call our Django backend with user.idToken
        // Example: this.http.post('http://localhost:8000/api/auth/google/', { access_token: user.idToken })
        // On success, save JWT and redirect
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit() {
    console.log('Login attempt', this.username);
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (user) => {
        console.log('Login successful, user:', user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login failed', err);
        this.errorMessage = '';
        if (err.error && typeof err.error === 'object') {
          for (const key in err.error) {
            if (Array.isArray(err.error[key])) {
              this.errorMessage += `${err.error[key].join(' ')} `;
            } else if (typeof err.error[key] === 'string') {
              this.errorMessage += `${err.error[key]} `;
            }
          }
        }
        if (!this.errorMessage) {
          this.errorMessage = 'Login failed. Please check your credentials.';
        }
      }
    });
  }
}
