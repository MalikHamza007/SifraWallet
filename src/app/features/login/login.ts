import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/api.interfaces';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="login-container">
        <div class="card login-card">
          <div class="logo-section">
            <span class="logo-icon">◈</span>
            <h1 class="logo-text">SIFRA Wallet</h1>
          </div>

          <h2 class="card-title">Welcome Back</h2>
          <p class="card-description">Login to your SIFRA Wallet</p>

          <form class="login-form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="username">Username or Email</label>
              <input
                type="text"
                id="username"
                [(ngModel)]="username"
                name="username"
                placeholder="Enter username or email"
                required
                [disabled]="isLoading()"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter your password"
                required
                [disabled]="isLoading()"
              />
            </div>

            @if (error()) {
            <div class="error-message">{{ error() }}</div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-lg btn-block"
              [disabled]="!username || !password || isLoading()"
            >
              @if (isLoading()) {
              <span class="spinner"></span>
              Logging in... } @else { Login }
            </button>
          </form>

          <div class="links">
            <a routerLink="/recover" class="recover-link">
              Forgot private key? Recover with mnemonic
            </a>
            <p class="signup-link">
              Don't have an account?
              <a routerLink="/onboarding">Create Wallet</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-lg);
      }

      .login-container {
        width: 100%;
        max-width: 420px;
      }

      .login-card {
        padding: var(--spacing-xl);
      }

      .logo-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-xl);
      }

      .logo-icon {
        font-size: 36px;
        color: var(--color-accent);
      }

      .logo-text {
        font-size: var(--font-size-xl);
        font-weight: 700;
        margin: 0;
      }

      .card-title {
        text-align: center;
        margin-bottom: var(--spacing-xs);
      }

      .card-description {
        text-align: center;
        color: var(--color-text-muted);
        margin-bottom: var(--spacing-xl);
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        margin-bottom: var(--spacing-sm);
        font-weight: 500;
        color: var(--color-text-secondary);
      }

      .form-group input {
        padding: var(--spacing-md);
      }

      .form-group input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .error-message {
        padding: var(--spacing-md);
        background-color: rgba(255, 77, 77, 0.1);
        border: 1px solid var(--color-error);
        border-radius: var(--radius-md);
        color: var(--color-error);
        font-size: var(--font-size-sm);
      }

      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: var(--spacing-sm);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .links {
        margin-top: var(--spacing-xl);
        text-align: center;
      }

      .recover-link {
        display: block;
        color: var(--color-accent);
        text-decoration: none;
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-md);
      }

      .recover-link:hover {
        text-decoration: underline;
      }

      .signup-link {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin: 0;
      }

      .signup-link a {
        color: var(--color-accent);
        text-decoration: none;
        font-weight: 500;
      }

      .signup-link a:hover {
        text-decoration: underline;
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form fields
  protected username = '';
  protected password = '';

  // State
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');

  onSubmit(): void {
    if (!this.username || !this.password) return;

    this.isLoading.set(true);
    this.error.set('');

    const loginData: LoginRequest = {
      username: this.username,
      password: this.password,
    };

    this.authService.login(loginData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(
          err.error?.non_field_errors?.[0] || err.error?.detail || 'Invalid username or password'
        );
      },
    });
  }
}
