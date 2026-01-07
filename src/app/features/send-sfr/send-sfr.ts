import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-send-sfr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="card send-card">
        <h1 class="card-title">Send SFR</h1>
        <p class="card-description">
          Transfer SFR tokens to another wallet address.
        </p>

        <form class="send-form" (ngSubmit)="sendTransaction()">
          <div class="form-group">
            <label for="receiver">Receiver Address</label>
            <input 
              type="text" 
              id="receiver"
              [(ngModel)]="receiverAddress"
              name="receiverAddress"
              placeholder="0x..."
              required
            />
          </div>

          <div class="form-group">
            <label for="amount">Amount (SFR)</label>
            <input 
              type="number" 
              id="amount"
              [(ngModel)]="amount"
              name="amount"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-lg btn-block"
            [disabled]="isLoading()">
            {{ isLoading() ? 'Processing...' : 'Send Transaction' }}
          </button>
        </form>

        @if (message()) {
          <div class="message" [class.success]="isSuccess()" [class.error]="!isSuccess()">
            <span class="message-icon">{{ isSuccess() ? '✓' : '✕' }}</span>
            {{ message() }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: calc(100vh - 73px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-lg);
    }

    .send-card {
      width: 100%;
      max-width: 480px;
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

    button[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      margin-top: var(--spacing-lg);
      font-weight: 500;
    }

    .message.success {
      background-color: var(--color-accent-light);
      color: var(--color-accent);
    }

    .message.error {
      background-color: rgba(255, 77, 77, 0.15);
      color: var(--color-error);
    }

    .message-icon {
      font-size: var(--font-size-lg);
    }
  `]
})
export class SendSfrComponent {
  protected receiverAddress = '';
  protected amount: number | null = null;

  protected readonly isLoading = signal(false);
  protected readonly message = signal('');
  protected readonly isSuccess = signal(false);

  sendTransaction(): void {
    if (!this.receiverAddress || !this.amount) {
      this.showMessage('Please fill in all fields', false);
      return;
    }

    if (!this.receiverAddress.startsWith('0x') || this.receiverAddress.length !== 42) {
      this.showMessage('Invalid receiver address format', false);
      return;
    }

    if (this.amount <= 0) {
      this.showMessage('Amount must be greater than 0', false);
      return;
    }

    this.isLoading.set(true);
    this.message.set('');

    // Simulate transaction processing
    setTimeout(() => {
      this.isLoading.set(false);
      this.showMessage(`Successfully sent ${this.amount} SFR to ${this.receiverAddress.slice(0, 10)}...`, true);
      this.receiverAddress = '';
      this.amount = null;
    }, 1500);
  }

  private showMessage(msg: string, success: boolean): void {
    this.message.set(msg);
    this.isSuccess.set(success);
  }
}
