import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="container">
        <h1 class="page-title">Profile & Settings</h1>

        <!-- User Info Card -->
        <div class="card profile-card">
          <div class="profile-header">
            <div class="avatar">
              {{ getInitials() }}
            </div>
            <div class="profile-info">
              <h2 class="profile-name">{{ authService.currentUser()?.username || 'User' }}</h2>
              <span class="profile-email">{{ authService.currentUser()?.email || '' }}</span>
            </div>
          </div>
        </div>

        <!-- Wallet Details -->
        <div class="card">
          <h3 class="card-title">Wallet Details</h3>

          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">Username</span>
              <span class="detail-value">{{
                authService.currentUser()?.username || 'Not set'
              }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ authService.currentUser()?.email || 'Not set' }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Public Address</span>
              <div class="address-row">
                <span class="detail-value mono truncate">{{
                  authService.walletAddress() || 'N/A'
                }}</span>
                <button class="copy-btn-small" (click)="copyAddress()">
                  {{ copied() ? '✓' : '⧉' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div class="card">
          <h3 class="card-title">Security</h3>

          <div class="security-info">
            <div class="security-item">
              <span class="security-icon">🔑</span>
              <div class="security-content">
                <span class="security-title">Private Key</span>
                <span class="security-desc"
                  >Your private key is never stored. You need it to sign transactions.</span
                >
              </div>
            </div>
            <div class="security-item">
              <span class="security-icon">📝</span>
              <div class="security-content">
                <span class="security-title">Recovery Phrase</span>
                <span class="security-desc"
                  >Lost your private key? Recover it with your 12-word mnemonic phrase.</span
                >
              </div>
              <a href="/recover" class="security-link">Recover →</a>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card">
          <h3 class="card-title">Account</h3>

          <div class="action-list">
            <button class="btn btn-danger btn-block" (click)="confirmLogout()">Logout</button>
          </div>
        </div>

        <!-- Confirmation Modal -->
        @if (showConfirmModal()) {
          <div class="modal-overlay" (click)="cancelLogout()">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3 class="modal-title">Logout?</h3>
              <p class="modal-text">
                Are you sure you want to logout? Make sure you have saved your private key and
                recovery phrase.
              </p>
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="cancelLogout()">Cancel</button>
                <button class="btn btn-danger" (click)="logout()">Logout</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100vh;
        padding: var(--spacing-lg);
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
      }

      .page-title {
        margin-bottom: var(--spacing-xl);
      }

      .card {
        margin-bottom: var(--spacing-lg);
      }

      .card-title {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--color-surface-border);
      }

      /* Profile Header */
      .profile-card {
        padding: var(--spacing-xl);
      }

      .profile-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
      }

      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--color-background);
      }

      .profile-info {
        flex: 1;
      }

      .profile-name {
        font-size: var(--font-size-xl);
        margin-bottom: var(--spacing-xs);
      }

      .profile-email {
        color: var(--color-text-muted);
      }

      /* Details */
      .detail-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        padding: var(--spacing-md);
        background-color: var(--color-surface-light);
        border-radius: var(--radius-md);
      }

      .detail-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-value {
        color: var(--color-text);
      }

      .detail-value.mono {
        font-family: monospace;
        font-size: var(--font-size-sm);
      }

      .truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .address-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .copy-btn-small {
        padding: var(--spacing-xs) var(--spacing-sm);
        background-color: var(--color-accent);
        color: var(--color-background);
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .copy-btn-small:hover {
        background-color: var(--color-accent-hover);
      }

      /* Security */
      .security-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .security-item {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background-color: var(--color-surface-light);
        border-radius: var(--radius-md);
      }

      .security-icon {
        font-size: var(--font-size-xl);
      }

      .security-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .security-title {
        font-weight: 500;
        color: var(--color-text);
      }

      .security-desc {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .security-link {
        color: var(--color-accent);
        text-decoration: none;
        font-size: var(--font-size-sm);
        font-weight: 500;
      }

      .security-link:hover {
        text-decoration: underline;
      }

      /* Actions */
      .action-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .btn-danger {
        background-color: var(--color-error);
        color: white;
        padding: var(--spacing-md);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 500;
        transition: all var(--transition-fast);
      }

      .btn-danger:hover {
        background-color: #e64444;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--spacing-lg);
      }

      .modal {
        background-color: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        max-width: 400px;
        width: 100%;
      }

      .modal-title {
        margin-bottom: var(--spacing-md);
      }

      .modal-text {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-xl);
      }

      .modal-actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: flex-end;
      }
    `,
  ],
})
export class ProfileComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly copied = signal(false);
  protected readonly showConfirmModal = signal(false);

  getInitials(): string {
    const username = this.authService.currentUser()?.username || 'U';
    return username.slice(0, 2).toUpperCase();
  }

  async copyAddress(): Promise<void> {
    const address = this.authService.walletAddress();
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  confirmLogout(): void {
    this.showConfirmModal.set(true);
  }

  cancelLogout(): void {
    this.showConfirmModal.set(false);
  }

  logout(): void {
    this.showConfirmModal.set(false);
    this.authService.logout();
  }
}
