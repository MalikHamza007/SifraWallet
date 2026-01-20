import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../core/services/wallet.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-add-funds',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="page-overlay">
      <div class="glass-card">
        <div class="card-header">
          <h1 class="title">Add Funds</h1>
          <p class="subtitle">Purchase SIFRA tokens instantly</p>
        </div>

        <div class="amount-section">
          <div class="input-container">
            <span class="unit">SIFRA</span>
            <input
              type="number"
              [(ngModel)]="amount"
              (input)="onAmountChange($event)"
              placeholder="0.00"
              [disabled]="status() === 'processing'"
              class="amount-input"
            />
          </div>
          <div class="conversion-row">
            <span class="label">Est. Cost</span>
            <span class="value">{{ usdCost() | number: '1.2-2' }} USD</span>
          </div>
        </div>

        <div class="market-info">
          <span class="price-pill">1 SFR = $0.75 USD</span>
          <p class="powered-by">Powered by Sifra Market Engine</p>
        </div>

        <!-- Status Display -->
        @if (status() !== 'idle') {
          <div class="status-display" [class]="status()">
            @switch (status()) {
              @case ('processing') {
                <div class="status-content">
                  <div class="status-spinner"></div>
                  <span>Processing deposit...</span>
                </div>
              }
              @case ('success') {
                <div class="status-content">
                  <span class="status-icon success">✓</span>
                  <div class="status-details">
                    <span class="status-title">Success!</span>
                    <span class="status-text">{{ successMessage() }}</span>
                  </div>
                </div>
              }
              @case ('error') {
                <div class="status-content">
                  <span class="status-icon error">✕</span>
                  <div class="status-details">
                    <span class="status-title">Failed</span>
                    <span class="status-text">{{ errorMessage() }}</span>
                  </div>
                </div>
              }
            }
          </div>
        }

        @if (status() !== 'success' && status() !== 'processing') {
          <button
            class="confirm-btn"
            (click)="confirmDeposit()"
            [disabled]="!isValid() || status() === 'processing'"
          >
            Confirm Deposit
          </button>
        } @else if (status() === 'success') {
          <button class="confirm-btn" (click)="resetForm()">Add More Funds</button>
        }

        <a routerLink="/dashboard" class="cancel-link">Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [
    `
      .page-overlay {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at top right, #1a1b26, #0a0b10);
        padding: 20px;
        font-family:
          'Inter',
          system-ui,
          -apple-system,
          sans-serif;
      }

      .glass-card {
        width: 100%;
        max-width: 440px;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 40px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .card-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .title {
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }

      .subtitle {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
      }

      .amount-section {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 24px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .input-container {
        display: flex;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 16px;
      }

      .unit {
        font-size: 14px;
        font-weight: 600;
        color: #00c6ff;
        text-transform: uppercase;
      }

      .amount-input {
        flex: 1;
        background: none;
        border: none;
        color: #fff;
        font-size: 40px;
        font-weight: 700;
        outline: none;
        width: 100%;
        padding: 0;
      }

      .amount-input::placeholder {
        color: rgba(255, 255, 255, 0.1);
      }

      .conversion-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 16px;
      }

      .label {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
      }

      .value {
        font-size: 16px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }

      .market-info {
        text-align: center;
        margin-bottom: 32px;
      }

      .price-pill {
        display: inline-block;
        padding: 6px 16px;
        background: rgba(0, 198, 255, 0.1);
        border: 1px solid rgba(0, 198, 255, 0.2);
        border-radius: 100px;
        color: #00c6ff;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .powered-by {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Status Display Pattern */
      .status-display {
        margin-bottom: 24px;
        padding: 16px;
        border-radius: 16px;
        animation: fadeIn 0.3s ease;
      }

      .status-display.processing {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
      }

      .status-display.success {
        background: rgba(0, 230, 118, 0.1);
        border: 1px solid rgba(0, 230, 118, 0.2);
        color: #00e676;
      }

      .status-display.error {
        background: rgba(255, 77, 77, 0.1);
        border: 1px solid rgba(255, 77, 77, 0.2);
        color: #ff4d4d;
      }

      .status-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .status-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: #00c6ff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .status-icon {
        font-size: 20px;
      }

      .status-details {
        display: flex;
        flex-direction: column;
      }

      .status-title {
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 2px;
      }

      .status-text {
        font-size: 13px;
        opacity: 0.8;
      }

      .confirm-btn {
        width: 100%;
        padding: 18px;
        background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
        border: none;
        border-radius: 16px;
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 10px 20px -5px rgba(0, 114, 255, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .confirm-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 15px 30px -5px rgba(0, 114, 255, 0.6);
      }

      .confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(0.5);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .cancel-link {
        display: block;
        text-align: center;
        margin-top: 24px;
        color: rgba(255, 255, 255, 0.4);
        text-decoration: none;
        font-size: 13px;
        transition: color 0.2s;
      }

      .cancel-link:hover {
        color: #fff;
      }
    `,
  ],
})
export class AddFundsComponent implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  // Signals
  protected readonly amount = signal<number | null>(null);
  protected readonly status = signal<'idle' | 'processing' | 'success' | 'error'>('idle');
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  // Computed
  protected readonly usdCost = computed(() => {
    const amt = this.amount();
    return amt ? amt * 0.75 : 0;
  });

  protected readonly isValid = computed(() => {
    const amt = this.amount();
    return amt !== null && amt > 0;
  });

  ngOnInit(): void {
    this.fetchMarketPrice();
  }

  fetchMarketPrice(): void {
    this.apiService.getMarketPrice().subscribe({
      next: (res) => this.walletService.updateMarketPrice(res.current_price_usd),
      error: () => console.warn('Using default price $0.75'),
    });
  }

  onAmountChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.amount.set(val ? parseFloat(val) : null);
    if (this.status() === 'error') {
      this.status.set('idle');
    }
  }

  confirmDeposit(): void {
    if (!this.isValid() || this.status() === 'processing') return;

    this.status.set('processing');
    this.successMessage.set('');
    this.errorMessage.set('');

    const amt = this.amount()!;
    const address = this.authService.walletAddress();

    if (!address) {
      this.status.set('error');
      this.errorMessage.set('Wallet address not found. Please log in again.');
      return;
    }

    this.walletService.deposit(address, amt).subscribe({
      next: () => {
        this.status.set('success');
        this.successMessage.set(`Successfully added ${amt} SIFRA to your wallet!`);
        this.amount.set(null);
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(
          err.error?.message || err.error?.detail || 'Deposit failed. Please try again.',
        );
      },
    });
  }

  resetForm(): void {
    this.amount.set(null);
    this.status.set('idle');
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
