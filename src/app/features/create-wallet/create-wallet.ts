import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';

@Component({
  selector: 'app-create-wallet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="card wallet-card">
        <h1 class="card-title">Create Wallet</h1>
        <p class="card-description">
          Generate a new wallet to start sending and receiving SFR tokens.
        </p>

        @if (!walletCreated()) {
          <button class="btn btn-primary btn-lg btn-block" (click)="generateWallet()">
            Generate Wallet
          </button>
        } @else {
          <div class="wallet-info">
            <div class="success-message">
              <span class="success-icon">✓</span>
              Wallet created successfully
            </div>

            <div class="address-section">
              <label class="address-label">Public Address</label>
              <div class="address-box">
                <input 
                  type="text" 
                  [value]="publicAddress()" 
                  readonly 
                  class="address-input"
                />
                <button 
                  class="copy-btn" 
                  (click)="copyAddress()"
                  [class.copied]="copied()">
                  {{ copied() ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>

            <button class="btn btn-secondary btn-block" (click)="reset()">
              Create Another Wallet
            </button>
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

    .wallet-card {
      width: 100%;
      max-width: 480px;
      text-align: center;
    }

    .card-title {
      margin-bottom: var(--spacing-sm);
    }

    .card-description {
      margin-bottom: var(--spacing-xl);
    }

    .wallet-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .success-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: var(--color-accent-light);
      color: var(--color-accent);
      border-radius: var(--radius-md);
      font-weight: 600;
    }

    .success-icon {
      font-size: var(--font-size-xl);
    }

    .address-section {
      text-align: left;
    }

    .address-label {
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .address-box {
      display: flex;
      gap: var(--spacing-sm);
    }

    .address-input {
      flex: 1;
      font-family: monospace;
      font-size: var(--font-size-sm);
      background-color: var(--color-background);
    }

    .copy-btn {
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-accent);
      color: var(--color-background);
      border: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      min-width: 80px;
    }

    .copy-btn:hover {
      background-color: var(--color-accent-hover);
    }

    .copy-btn.copied {
      background-color: var(--color-accent-hover);
    }
  `]
})
export class CreateWalletComponent {
  protected readonly walletCreated = signal(false);
  protected readonly publicAddress = signal('');
  protected readonly copied = signal(false);

  generateWallet(): void {
    // Generate a mock public address (in real app, this would use crypto)
    const address = this.generateMockAddress();
    this.publicAddress.set(address);
    this.walletCreated.set(true);
  }

  async copyAddress(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.publicAddress());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }

  reset(): void {
    this.walletCreated.set(false);
    this.publicAddress.set('');
    this.copied.set(false);
  }

  private generateMockAddress(): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }
}
