import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule, GoogleSigninButtonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent implements OnInit {
  username = '';
  email = '';
  password = '';
  role = 'USER';
  currentBgImage = '/assets/auth_dyn_1.png';
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
        console.log('Google User Registered/Logged In:', user);
        // Here we would call our Django backend with user.idToken
        // Example: this.http.post('http://localhost:8000/api/auth/google/', { access_token: user.idToken })
        // On success, save JWT and redirect
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit() {
    console.log('Register attempt', this.username, this.role);
    const userData = {
      username: this.username,
      email: this.email,
      password: this.password,
      password1: this.password,
      password2: this.password,
      role: this.role
    };

    this.authService.register(userData).subscribe({
      next: (res) => {
        console.log('Registration successful', res);
        this.authService.getUserProfile().subscribe(() => {
          this.router.navigate(['/']);
        });
      },
      error: (err) => {
        console.error('Registration failed', err);
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
          this.errorMessage = 'Registration failed. Please check your details.';
        }
      }
    });
  }
}
