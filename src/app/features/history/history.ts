import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import {
  ApiTransaction,
  BalanceResponse,
  WalletTransactionsResponse,
} from '../../core/models/api.interfaces';

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="page">
      <div class="container">
        <h1 class="page-title">Transaction History</h1>

        <!-- Balance Card -->
        <div class="card balance-card">
          <span class="balance-label">Current Balance</span>
          <div class="balance-value">
            <span class="balance-amount">{{ balance() | number: '1.2-2' }}</span>
            <span class="balance-currency">SFR</span>
          </div>
        </div>

        <!-- Transaction History -->
        <div class="card history-card">
          <div class="section-header">
            <h2 class="section-title">All Transactions</h2>
            <button class="refresh-btn" (click)="loadTransactions()" [disabled]="isLoading()">
              {{ isLoading() ? '⟳' : '↻' }} Refresh
            </button>
          </div>

          @if (isLoading()) {
            <div class="loading-state">Loading transactions...</div>
          } @else if (transactions().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📭</span>
              <p>No transactions yet</p>
              <p class="empty-hint">Send or receive SFR to see your transaction history</p>
            </div>
          } @else {
            <!-- Desktop Table -->
            <div class="table-wrapper">
              <table class="transactions-table">
                <thead>
                  <tr>
                    <th>Transaction Hash</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tx of transactions(); track tx.tx_hash) {
                    <tr>
                      <td class="hash">{{ formatHash(tx.tx_hash) }}</td>
                      <td class="address">{{ formatAddress(tx.sender) }}</td>
                      <td class="address">{{ formatAddress(tx.receiver) }}</td>
                      <td class="amount" [class.incoming]="isIncoming(tx)">
                        {{ isIncoming(tx) ? '+' : '-' }}{{ tx.amount }} SFR
                      </td>
                      <td>
                        <span class="status-badge" [class]="tx.status">
                          {{ tx.status }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-transactions">
              @for (tx of transactions(); track tx.tx_hash) {
                <div class="tx-card">
                  <div class="tx-card-header">
                    <span class="tx-type" [class.incoming]="isIncoming(tx)">
                      {{ isIncoming(tx) ? '↙ Received' : '↗ Sent' }}
                    </span>
                    <span class="status-badge" [class]="tx.status">
                      {{ tx.status }}
                    </span>
                  </div>

                  <div class="tx-card-amount" [class.incoming]="isIncoming(tx)">
                    {{ isIncoming(tx) ? '+' : '-' }}{{ tx.amount }} SFR
                  </div>

                  <div class="tx-card-details">
                    <div class="tx-row">
                      <span class="tx-label">Hash</span>
                      <span class="tx-value hash">{{ formatHash(tx.tx_hash) }}</span>
                    </div>
                    <div class="tx-row">
                      <span class="tx-label">From</span>
                      <span class="tx-value address">{{ formatAddress(tx.sender) }}</span>
                    </div>
                    <div class="tx-row">
                      <span class="tx-label">To</span>
                      <span class="tx-value address">{{ formatAddress(tx.receiver) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
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
        max-width: 1000px;
        margin: 0 auto;
      }

      .page-title {
        margin-bottom: var(--spacing-xl);
      }

      /* Balance Card */
      .balance-card {
        text-align: center;
        padding: var(--spacing-xl);
        margin-bottom: var(--spacing-xl);
        border-color: var(--color-accent);
      }

      .balance-label {
        display: block;
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-sm);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .balance-value {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: var(--spacing-sm);
      }

      .balance-amount {
        font-size: 48px;
        font-weight: 700;
        color: var(--color-accent);
      }

      .balance-currency {
        font-size: var(--font-size-xl);
        color: var(--color-text-secondary);
        font-weight: 500;
      }

      /* History Card */
      .history-card {
        padding: var(--spacing-lg);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .section-title {
        font-size: var(--font-size-xl);
        margin: 0;
      }

      .refresh-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background: none;
        border: 1px solid var(--color-surface-border);
        color: var(--color-text-muted);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: all var(--transition-fast);
      }

      .refresh-btn:hover:not(:disabled) {
        border-color: var(--color-accent);
        color: var(--color-accent);
      }

      .refresh-btn:disabled {
        opacity: 0.5;
      }

      /* Loading & Empty State */
      .loading-state,
      .empty-state {
        text-align: center;
        padding: var(--spacing-2xl);
        color: var(--color-text-muted);
      }

      .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: var(--spacing-md);
      }

      .empty-hint {
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-sm);
      }

      /* Table */
      .table-wrapper {
        overflow-x: auto;
      }

      .transactions-table {
        width: 100%;
        border-collapse: collapse;
      }

      .transactions-table th,
      .transactions-table td {
        padding: var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--color-surface-border);
      }

      .transactions-table th {
        color: var(--color-text-secondary);
        font-weight: 500;
        font-size: var(--font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .transactions-table tbody tr:hover {
        background-color: var(--color-surface-light);
      }

      .hash,
      .address {
        font-family: monospace;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .amount {
        font-weight: 600;
        color: #ff6b6b;
      }

      .amount.incoming {
        color: var(--color-accent);
      }

      .status-badge {
        display: inline-block;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge.confirmed {
        background-color: var(--color-accent-light);
        color: var(--color-accent);
      }

      .status-badge.pending {
        background-color: rgba(255, 184, 77, 0.15);
        color: var(--color-warning);
      }

      .status-badge.failed {
        background-color: rgba(255, 77, 77, 0.15);
        color: var(--color-error);
      }

      /* Mobile Transactions */
      .mobile-transactions {
        display: none;
      }

      .tx-card {
        background-color: var(--color-surface-light);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
      }

      .tx-card:last-child {
        margin-bottom: 0;
      }

      .tx-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .tx-type {
        font-weight: 600;
        color: #ff6b6b;
      }

      .tx-type.incoming {
        color: var(--color-accent);
      }

      .tx-card-amount {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: #ff6b6b;
        margin-bottom: var(--spacing-md);
      }

      .tx-card-amount.incoming {
        color: var(--color-accent);
      }

      .tx-card-details {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .tx-row {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-sm) 0;
        border-top: 1px solid var(--color-surface-border);
      }

      .tx-label {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .tx-value {
        font-size: var(--font-size-sm);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .balance-amount {
          font-size: 36px;
        }

        .table-wrapper {
          display: none;
        }

        .mobile-transactions {
          display: block;
        }
      }
    `,
  ],
})
export class HistoryComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);

  // State
  protected readonly balance = signal(0);
  protected readonly transactions = signal<ApiTransaction[]>([]);
  protected readonly isLoading = signal(false);

  ngOnInit(): void {
    this.loadBalance();
    this.loadTransactions();
  }

  loadBalance(): void {
    const address = this.authService.walletAddress();
    if (!address) return;

    this.apiService.getBalance(address).subscribe({
      next: (response: BalanceResponse) => {
        this.balance.set(parseFloat(response.balance));
      },
    });
  }

  loadTransactions(): void {
    const address = this.authService.walletAddress();
    if (!address) return;

    this.isLoading.set(true);
    this.apiService.getWalletTransactions(address).subscribe({
      next: (response: WalletTransactionsResponse) => {
        this.transactions.set(response.transactions);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  formatHash(hash: string): string {
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  }

  isIncoming(tx: ApiTransaction): boolean {
    return tx.receiver === this.authService.walletAddress();
  }
}
