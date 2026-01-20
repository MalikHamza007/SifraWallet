import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { TransactionService } from '../../core/services/transaction.service';

type TransactionStatus = 'idle' | 'confirming' | 'signing' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-send-sfr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="page">
      <div class="card send-card">
        <h1 class="card-title">Send SFR</h1>
        <p class="card-description">Transfer SIFRA tokens to another wallet.</p>

        <form class="send-form" (ngSubmit)="sendTransaction()">
          <!-- Sender Wallet (Read-only) -->
          <div class="form-group">
            <label for="sender">From Wallet</label>
            <div class="sender-box">
              <span class="sender-address">{{
                formatAddress(authService.walletAddress() || '')
              }}</span>
              <span class="sender-balance">Balance: {{ balance() | number: '1.2-2' }} SFR</span>
            </div>
          </div>

          <!-- Receiver Address -->
          <div class="form-group">
            <label for="receiver">Receiver Address *</label>
            <input
              type="text"
              id="receiver"
              [(ngModel)]="receiverAddress"
              name="receiverAddress"
              placeholder="Enter recipient's wallet address"
              required
              [disabled]="status() !== 'idle'"
            />
            <span class="field-hint">The recipient's public wallet address</span>
          </div>

          <!-- Amount -->
          <div class="form-group">
            <label for="amount">Amount (SFR) *</label>
            <div class="amount-input-wrapper">
              <input
                type="number"
                id="amount"
                [(ngModel)]="amount"
                name="amount"
                placeholder="0.00"
                min="0"
                step="any"
                required
                [disabled]="status() !== 'idle'"
              />
              <button
                type="button"
                class="max-btn"
                (click)="setMaxAmount()"
                [disabled]="status() !== 'idle'"
              >
                MAX
              </button>
            </div>
          </div>

          <!-- Private Key -->
          <div class="form-group">
            <label for="privateKey">Your Private Key *</label>
            <div class="warning-box">
              <span class="warning-icon">🔐</span>
              <span
                >Your private key is used to sign this transaction locally. It is NOT sent to the
                server.</span
              >
            </div>
            <input
              type="password"
              id="privateKey"
              [(ngModel)]="privateKey"
              name="privateKey"
              placeholder="Enter your private key (64 hex characters)"
              required
              [disabled]="status() !== 'idle'"
            />
            <span class="helper-text">
              Don't have your private key?
              <a routerLink="/recover">Recover it with your mnemonic phrase</a>
            </span>
          </div>

          <!-- Transaction Status & PIN Prompt -->
          @if (status() !== 'idle') {
            <div class="status-display" [class]="status()">
              @switch (status()) {
                @case ('confirming') {
                  <div class="pin-prompt-box">
                    <span class="prompt-title">Enter Transaction PIN</span>
                    <p class="prompt-text">
                      Please enter your 4-digit PIN to authorize this transfer.
                    </p>
                    <div class="pin-input-group">
                      <input
                        type="password"
                        [(ngModel)]="transactionPin"
                        name="transactionPin"
                        placeholder="••••"
                        maxlength="4"
                        pattern="[0-9]{4}"
                        class="pin-input"
                        #pinInput
                        (keyup.enter)="executeTransaction()"
                        autofocus
                      />
                      <div class="pin-actions">
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          (click)="status.set('idle')"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          class="btn btn-primary btn-sm"
                          [disabled]="transactionPin.length !== 4"
                          (click)="executeTransaction()"
                        >
                          Confirm & Send
                        </button>
                      </div>
                    </div>
                  </div>
                }
                @case ('signing') {
                  <div class="status-content">
                    <div class="status-spinner"></div>
                    <span>Signing transaction...</span>
                  </div>
                }
                @case ('sending') {
                  <div class="status-content">
                    <div class="status-spinner"></div>
                    <span>Sending to blockchain...</span>
                  </div>
                }
                @case ('success') {
                  <div class="status-content">
                    <span class="status-icon success">✓</span>
                    <div class="status-details">
                      <span class="status-title">Transaction Successful!</span>
                      <span class="status-hash">TX: {{ formatHash(lastTxHash()) }}</span>
                    </div>
                  </div>
                }
                @case ('error') {
                  <div class="status-content">
                    <span class="status-icon error">✕</span>
                    <span>{{ errorMessage() }}</span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-error mt-md"
                    (click)="status.set('idle')"
                  >
                    Try Again
                  </button>
                }
              }
            </div>
          }

          <!-- Submit Button -->
          @if (status() === 'idle') {
            <button
              type="submit"
              class="btn btn-primary btn-lg btn-block"
              [disabled]="!isFormValid()"
            >
              Sign & Send Transaction
            </button>
          }
          @if (status() === 'success') {
            <button type="button" class="btn btn-secondary btn-lg btn-block" (click)="resetForm()">
              Send Another Transaction
            </button>
          }
        </form>
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

      .send-card {
        width: 100%;
        max-width: 560px;
        padding: var(--spacing-xl);
      }

      .card-title {
        text-align: center;
        margin-bottom: var(--spacing-sm);
      }

      .card-description {
        text-align: center;
        margin-bottom: var(--spacing-xl);
      }

      .send-form {
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
        opacity: 0.5;
        cursor: not-allowed;
      }

      .field-hint {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin-top: var(--spacing-xs);
      }

      /* Sender Box */
      .sender-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background-color: var(--color-surface-light);
        border: 1px solid var(--color-surface-border);
        border-radius: var(--radius-md);
      }

      .sender-address {
        font-family: monospace;
        color: var(--color-text);
      }

      .sender-balance {
        font-size: var(--font-size-sm);
        color: var(--color-accent);
        font-weight: 500;
      }

      /* Amount Input */
      .amount-input-wrapper {
        display: flex;
        gap: var(--spacing-sm);
      }

      .amount-input-wrapper input {
        flex: 1;
      }

      .max-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background-color: var(--color-accent-light);
        color: var(--color-accent);
        border: 1px solid var(--color-accent);
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .max-btn:hover:not(:disabled) {
        background-color: var(--color-accent);
        color: var(--color-background);
      }

      .max-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Warning Box */
      .warning-box {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background-color: var(--color-accent-light);
        border: 1px solid var(--color-accent);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-accent);
        margin-bottom: var(--spacing-sm);
      }

      .warning-icon {
        font-size: var(--font-size-lg);
      }

      .helper-text {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin-top: var(--spacing-sm);
      }

      .helper-text a {
        color: var(--color-accent);
        text-decoration: none;
      }

      .helper-text a:hover {
        text-decoration: underline;
      }

      /* Status Display */
      .status-display {
        padding: var(--spacing-lg);
        border-radius: var(--radius-md);
        text-align: center;
      }

      .status-display.signing,
      .status-display.sending {
        background-color: var(--color-surface-light);
        border: 1px solid var(--color-surface-border);
      }

      .status-display.success {
        background-color: var(--color-accent-light);
        border: 1px solid var(--color-accent);
        color: var(--color-accent);
      }

      .status-display.error {
        background-color: rgba(255, 77, 77, 0.1);
        border: 1px solid var(--color-error);
        color: var(--color-error);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
      }

      .pin-prompt-box {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: rgba(42, 215, 146, 0.05);
        border: 1px solid var(--color-accent);
        border-radius: var(--radius-md);
      }

      .prompt-title {
        font-weight: 700;
        color: #fff;
        font-size: var(--font-size-md);
      }

      .prompt-text {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }

      .pin-input-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        margin-top: var(--spacing-sm);
      }

      .pin-input {
        letter-spacing: 12px;
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        padding: var(--spacing-sm) !important;
        background: var(--color-surface) !important;
        border: 2px solid var(--color-surface-border) !important;
        width: 160px;
        margin: 0 auto;
      }

      .pin-input:focus {
        border-color: var(--color-accent) !important;
      }

      .pin-actions {
        display: flex;
        gap: var(--spacing-sm);
        justify-content: center;
      }

      .btn-sm {
        padding: 6px 16px;
        font-size: 13px;
        min-width: 100px;
      }

      .btn-outline-error {
        background: transparent;
        border: 1px solid var(--color-error);
        color: var(--color-error);
      }

      .btn-outline-error:hover {
        background: var(--color-error);
        color: #fff;
      }

      .mt-md {
        margin-top: var(--spacing-md);
      }

      .status-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-md);
      }

      .status-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--color-surface-border);
        border-top-color: var(--color-accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .status-icon {
        font-size: var(--font-size-xl);
      }

      .status-details {
        display: flex;
        flex-direction: column;
        text-align: left;
      }

      .status-title {
        font-weight: 600;
      }

      .status-hash {
        font-size: var(--font-size-sm);
        font-family: monospace;
        opacity: 0.8;
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class SendSfrComponent {
  protected readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly transactionService = inject(TransactionService);

  // Form fields
  protected receiverAddress = '';
  protected amount = ''; // Handled as string for precision
  protected privateKey = '';
  protected transactionPin = '';

  // State
  protected readonly status = signal<TransactionStatus>('idle');
  protected readonly lastTxHash = signal('');
  protected readonly errorMessage = signal('');
  protected readonly balance = signal(0);
  private readonly rawBalance = signal('0');

  constructor() {
    this.loadBalance();
  }

  loadBalance(): void {
    const address = this.authService.walletAddress();
    if (!address) return;

    this.apiService.getBalance(address).subscribe({
      next: (response) => {
        this.balance.set(parseFloat(response.balance));
        this.rawBalance.set(response.balance);
      },
    });
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  }

  formatHash(hash: string): string {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  }

  setMaxAmount(): void {
    // Use the raw string from the API to maintain perfect precision
    this.amount = this.rawBalance();
  }

  isFormValid(): boolean {
    const numAmount = parseFloat(this.amount);
    return (
      !!this.receiverAddress &&
      !!this.amount &&
      !isNaN(numAmount) &&
      numAmount > 0 &&
      !!this.privateKey &&
      this.privateKey.length >= 64
    );
  }

  async sendTransaction(): Promise<void> {
    if (!this.isFormValid()) return;

    const numAmount = parseFloat(this.amount);
    if (numAmount <= 0) {
      this.status.set('error');
      this.errorMessage.set('Amount must be greater than 0');
      return;
    }

    if (numAmount > this.balance()) {
      this.status.set('error');
      this.errorMessage.set('Insufficient balance');
      return;
    }

    this.transactionPin = '';
    this.status.set('confirming');
  }

  async executeTransaction(): Promise<void> {
    if (this.transactionPin.length !== 4) return;

    try {
      // Step 1: Signing
      this.status.set('signing');
      await this.delay(800);

      // Step 2: Sending
      this.status.set('sending');

      // We pass the RAW string "amount" to ensure exact digit precision
      const txObservable = await this.transactionService.sendTransaction(
        this.receiverAddress,
        this.amount,
        this.privateKey,
        this.transactionPin,
      );

      txObservable.subscribe({
        next: (response) => {
          this.lastTxHash.set(response.tx_hash);
          this.status.set('success');

          // Refresh balance
          this.loadBalance();
        },
        error: (err) => {
          this.status.set('error');
          this.errorMessage.set(
            err.error?.error || err.error?.detail || 'Transaction failed. Please try again.',
          );
        },
      });
    } catch (err) {
      this.status.set('error');
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to sign transaction');
    }
  }

  resetForm(): void {
    this.receiverAddress = '';
    this.amount = '';
    this.privateKey = '';
    this.transactionPin = '';
    this.status.set('idle');
    this.lastTxHash.set('');
    this.errorMessage.set('');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
