import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-receive',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="card receive-card">
        <h1 class="title">Receive SFR</h1>
        <p class="description">Share your wallet address to receive SIFRA tokens.</p>

        <!-- QR Code Visual -->
        <div class="qr-section">
          <div class="qr-code">
            <div class="qr-pattern">
              <!-- Visual QR pattern using CSS -->
              @for (row of qrPattern; track $index) {
                <div class="qr-row">
                  @for (cell of row; track $index) {
                    <div class="qr-cell" [class.filled]="cell"></div>
                  }
                </div>
              }
            </div>
            <div class="qr-logo">◈</div>
          </div>
          <span class="qr-label">Scan to receive SFR</span>
        </div>

        <!-- Address Display -->
        <div class="address-section">
          <label class="address-label">Your Wallet Address</label>
          <div class="address-box">
            <input
              type="text"
              [value]="authService.walletAddress() || ''"
              readonly
              class="address-input"
            />
            <button class="copy-btn" (click)="copyAddress()" [class.copied]="copied()">
              {{ copied() ? '✓ Copied' : '⧉ Copy' }}
            </button>
          </div>
        </div>

        <!-- Full Address Display -->
        <div class="full-address-section">
          <label class="address-label">Full Address</label>
          <div class="full-address-box">
            <code>{{ authService.walletAddress() }}</code>
          </div>
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <span class="info-icon">ℹ</span>
          <div class="info-content">
            <strong>Share this address</strong>
            <p>
              Send this address to anyone who wants to send you SIFRA tokens. Only share your public
              address, never your private key.
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

      .receive-card {
        width: 100%;
        max-width: 480px;
        padding: var(--spacing-xl);
        text-align: center;
      }

      .title {
        margin-bottom: var(--spacing-sm);
      }

      .description {
        margin-bottom: var(--spacing-xl);
      }

      /* QR Code */
      .qr-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: var(--spacing-xl);
      }

      .qr-code {
        width: 200px;
        height: 200px;
        background-color: #fff;
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qr-pattern {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .qr-row {
        display: flex;
        gap: 2px;
        flex: 1;
      }

      .qr-cell {
        flex: 1;
        background-color: #e0e0e0;
        border-radius: 1px;
      }

      .qr-cell.filled {
        background-color: #000;
      }

      .qr-logo {
        position: absolute;
        width: 48px;
        height: 48px;
        background-color: #fff;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--color-accent);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .qr-label {
        margin-top: var(--spacing-md);
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      /* Address */
      .address-section {
        margin-bottom: var(--spacing-lg);
        text-align: left;
      }

      .address-label {
        display: block;
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--color-text-secondary);
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
        white-space: nowrap;
      }

      .copy-btn:hover {
        background-color: var(--color-accent-hover);
      }

      .copy-btn.copied {
        background-color: var(--color-accent-hover);
      }

      /* Full Address */
      .full-address-section {
        margin-bottom: var(--spacing-xl);
        text-align: left;
      }

      .full-address-box {
        background-color: var(--color-background);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-surface-border);
        word-break: break-all;
      }

      .full-address-box code {
        font-family: monospace;
        font-size: var(--font-size-sm);
        color: var(--color-accent);
      }

      /* Info Box */
      .info-box {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background-color: var(--color-surface-light);
        border-radius: var(--radius-md);
        text-align: left;
      }

      .info-icon {
        font-size: var(--font-size-xl);
        color: var(--color-info);
      }

      .info-content {
        flex: 1;
      }

      .info-content strong {
        display: block;
        margin-bottom: var(--spacing-xs);
        color: var(--color-text);
      }

      .info-content p {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin: 0;
      }
    `,
  ],
})
export class ReceiveComponent {
  protected readonly authService = inject(AuthService);
  protected readonly copied = signal(false);

  // Generate a visual QR-like pattern based on wallet address
  protected readonly qrPattern = this.generateQrPattern();

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

  private generateQrPattern(): boolean[][] {
    const size = 11;
    const pattern: boolean[][] = [];

    // Use wallet address to generate deterministic pattern
    const address = this.authService.walletAddress() || 'default';
    let seed = 0;
    for (let i = 0; i < address.length; i++) {
      seed += address.charCodeAt(i);
    }

    for (let i = 0; i < size; i++) {
      const row: boolean[] = [];
      for (let j = 0; j < size; j++) {
        // Create corner patterns
        const isCorner = (i < 3 && j < 3) || (i < 3 && j >= size - 3) || (i >= size - 3 && j < 3);

        // Create center empty area for logo
        const isCenter = i >= 4 && i <= 6 && j >= 4 && j <= 6;

        if (isCorner) {
          row.push(
            (i === 1 && j === 1) || (i === 1 && j === size - 2) || (i === size - 2 && j === 1)
              ? false
              : true,
          );
        } else if (isCenter) {
          row.push(false);
        } else {
          // Use seeded random for deterministic pattern
          const hash = (seed * (i + 1) * (j + 1)) % 100;
          row.push(hash > 50);
        }
      }
      pattern.push(row);
    }

    return pattern;
  }
}
