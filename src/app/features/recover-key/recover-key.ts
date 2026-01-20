import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RecoverResponse } from '../../core/models/api.interfaces';

@Component({
  selector: 'app-recover-key',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="recover-container">
        <div class="card recover-card">
          <div class="logo-section">
            <span class="logo-icon">◈</span>
            <h1 class="logo-text">SIFRA Wallet</h1>
          </div>

          <h2 class="card-title">Recover Your Private Key</h2>
          <p class="card-description">Enter your 12-word recovery phrase</p>

          <form class="recover-form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="mnemonic">Recovery Phrase (12 words)</label>
              <textarea
                id="mnemonic"
                [(ngModel)]="mnemonic"
                name="mnemonic"
                rows="4"
                placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                required
                [disabled]="isLoading()"
              ></textarea>
              @if (mnemonicError()) {
                <span class="field-error">{{ mnemonicError() }}</span>
              }
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-lg btn-block"
              [disabled]="!mnemonic || isLoading()"
            >
              @if (isLoading()) {
                <span class="spinner"></span>
                Recovering...
              } @else {
                Recover Key
              }
            </button>
          </form>

          <!-- Recovered Data Display -->
          @if (recoveredData()) {
            <div class="recovered-section">
              <div class="success-header">
                <span class="success-icon">✓</span>
                <h3>Key Recovered Successfully!</h3>
              </div>

              <div class="data-section">
                <h4>Your Private Key</h4>
                <div class="key-display">
                  <code>{{ recoveredData()?.private_key }}</code>
                </div>
                <button
                  class="btn btn-secondary btn-sm"
                  (click)="copyToClipboard(recoveredData()?.private_key || '')"
                >
                  {{ copiedPrivateKey() ? '✓ Copied!' : '⧉ Copy Private Key' }}
                </button>
              </div>

              <div class="data-section">
                <h4>Your Public Key / Wallet Address</h4>
                <div class="key-display">
                  <code>{{ recoveredData()?.public_key }}</code>
                </div>
                <button class="btn btn-secondary btn-sm" (click)="copyPublicKey()">
                  {{ copiedPublicKey() ? '✓ Copied!' : '⧉ Copy Address' }}
                </button>
              </div>

              @if (recoveredData()?.wallet_exists) {
                <div class="wallet-status found">
                  <span class="status-icon">✓</span>
                  <div class="status-content">
                    <span class="status-title">Wallet found in SIFRA network</span>
                    <span class="status-balance"
                      >Balance: <strong>{{ recoveredData()?.balance }} SFR</strong></span
                    >
                  </div>
                </div>
              } @else {
                <div class="wallet-status not-found">
                  <span class="status-icon">⚠</span>
                  <div class="status-content">
                    <span class="status-title">This wallet is not registered on the network</span>
                    <span class="status-hint"
                      >You can still use these keys, but you'll need to register the wallet
                      first.</span
                    >
                  </div>
                </div>
              }

              <div class="warning-box">
                <span class="warning-icon">⚠</span>
                <span>Never share your private key with anyone. Store it securely.</span>
              </div>
            </div>
          }

          <p class="login-link">
            <a routerLink="/login">← Back to Login</a>
          </p>
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

      .recover-container {
        width: 100%;
        max-width: 520px;
      }

      .recover-card {
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

      .recover-form {
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

      .form-group textarea {
        padding: var(--spacing-md);
        resize: vertical;
        min-height: 100px;
      }

      .form-group textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .field-error {
        color: var(--color-error);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
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

      /* Recovered Section */
      .recovered-section {
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-xl);
        border-top: 1px solid var(--color-surface-border);
      }

      .success-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-xl);
      }

      .success-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--color-accent);
        color: var(--color-background);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-lg);
      }

      .success-header h3 {
        margin: 0;
        color: var(--color-accent);
      }

      .data-section {
        margin-bottom: var(--spacing-lg);
      }

      .data-section h4 {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--spacing-sm);
      }

      .key-display {
        background-color: var(--color-background);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-surface-border);
        margin-bottom: var(--spacing-sm);
        word-break: break-all;
      }

      .key-display code {
        font-family: monospace;
        font-size: var(--font-size-sm);
        color: var(--color-accent);
      }

      .btn-sm {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-sm);
      }

      .wallet-status {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-lg);
      }

      .wallet-status.found {
        background-color: var(--color-accent-light);
        border: 1px solid var(--color-accent);
      }

      .wallet-status.found .status-icon {
        color: var(--color-accent);
      }

      .wallet-status.not-found {
        background-color: rgba(255, 184, 77, 0.1);
        border: 1px solid var(--color-warning);
      }

      .wallet-status.not-found .status-icon {
        color: var(--color-warning);
      }

      .status-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .status-title {
        font-weight: 500;
      }

      .status-balance {
        font-size: var(--font-size-sm);
      }

      .status-hint {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .warning-box {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background-color: rgba(255, 184, 77, 0.1);
        border: 1px solid var(--color-warning);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-warning);
      }

      .warning-icon {
        font-size: var(--font-size-lg);
      }

      .login-link {
        text-align: center;
        margin-top: var(--spacing-xl);
      }

      .login-link a {
        color: var(--color-accent);
        text-decoration: none;
      }

      .login-link a:hover {
        text-decoration: underline;
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class RecoverKeyComponent {
  private readonly authService = inject(AuthService);

  // Form fields
  protected mnemonic = '';

  // State
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');
  protected readonly mnemonicError = signal('');
  protected readonly recoveredData = signal<RecoverResponse | null>(null);
  protected readonly copiedPrivateKey = signal(false);
  protected readonly copiedPublicKey = signal(false);

  private validateMnemonic(): boolean {
    const words = this.mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      this.mnemonicError.set('Must be exactly 12 words');
      return false;
    }
    this.mnemonicError.set('');
    return true;
  }

  onSubmit(): void {
    if (!this.mnemonic || !this.validateMnemonic()) return;

    this.isLoading.set(true);
    this.error.set('');
    this.recoveredData.set(null);

    const normalizedMnemonic = this.mnemonic.trim().toLowerCase();

    this.authService.recoverKey(normalizedMnemonic).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.recoveredData.set(response);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(
          err.error?.mnemonic?.[0] ||
            err.error?.detail ||
            'Invalid mnemonic phrase. Please check and try again.',
        );
      },
    });
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedPrivateKey.set(true);
      setTimeout(() => this.copiedPrivateKey.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async copyPublicKey(): Promise<void> {
    const publicKey = this.recoveredData()?.public_key;
    if (!publicKey) return;

    try {
      await navigator.clipboard.writeText(publicKey);
      this.copiedPublicKey.set(true);
      setTimeout(() => this.copiedPublicKey.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
