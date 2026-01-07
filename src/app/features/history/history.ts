import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

interface Transaction {
  from: string;
  to: string;
  amount: number;
  blockIndex: number;
}

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="page">
      <div class="container">
        <!-- Balance Card -->
        <div class="card balance-card">
          <span class="balance-label">Current Balance</span>
          <div class="balance-value">
            <span class="balance-amount">{{ balance() | number:'1.2-2' }}</span>
            <span class="balance-currency">SFR</span>
          </div>
        </div>

        <!-- Transaction History -->
        <div class="card history-card">
          <h2 class="section-title">Transaction History</h2>

          @if (transactions().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📭</span>
              <p>No transactions yet</p>
            </div>
          } @else {
            <!-- Desktop Table -->
            <div class="table-wrapper">
              <table class="transactions-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Block</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tx of transactions(); track tx.blockIndex) {
                    <tr>
                      <td class="address">{{ formatAddress(tx.from) }}</td>
                      <td class="address">{{ formatAddress(tx.to) }}</td>
                      <td class="amount">{{ tx.amount }} SFR</td>
                      <td class="block">#{{ tx.blockIndex }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-transactions">
              @for (tx of transactions(); track tx.blockIndex) {
                <div class="tx-card">
                  <div class="tx-row">
                    <span class="tx-label">From</span>
                    <span class="tx-value address">{{ formatAddress(tx.from) }}</span>
                  </div>
                  <div class="tx-row">
                    <span class="tx-label">To</span>
                    <span class="tx-value address">{{ formatAddress(tx.to) }}</span>
                  </div>
                  <div class="tx-row">
                    <span class="tx-label">Amount</span>
                    <span class="tx-value amount">{{ tx.amount }} SFR</span>
                  </div>
                  <div class="tx-row">
                    <span class="tx-label">Block</span>
                    <span class="tx-value block">#{{ tx.blockIndex }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: calc(100vh - 73px);
      padding: var(--spacing-lg);
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    /* Balance Card */
    .balance-card {
      text-align: center;
      padding: var(--spacing-xl);
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

    .section-title {
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-xl);
    }

    /* Empty State */
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

    .address {
      font-family: monospace;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .amount {
      color: var(--color-accent);
      font-weight: 600;
    }

    .block {
      color: var(--color-text-muted);
    }

    /* Mobile Transactions */
    .mobile-transactions {
      display: none;
    }

    .tx-card {
      background-color: var(--color-surface-light);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .tx-card:last-child {
      margin-bottom: 0;
    }

    .tx-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--color-surface-border);
    }

    .tx-row:last-child {
      border-bottom: none;
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
  `]
})
export class HistoryComponent {
  protected readonly balance = signal(1250.75);

  protected readonly transactions = signal<Transaction[]>([
    { from: '0x1234567890abcdef1234567890abcdef12345678', to: '0xabcdef1234567890abcdef1234567890abcdef12', amount: 50, blockIndex: 145 },
    { from: '0xabcdef1234567890abcdef1234567890abcdef12', to: '0x1234567890abcdef1234567890abcdef12345678', amount: 125.5, blockIndex: 144 },
    { from: '0x9876543210fedcba9876543210fedcba98765432', to: '0x1234567890abcdef1234567890abcdef12345678', amount: 200, blockIndex: 142 },
    { from: '0x1234567890abcdef1234567890abcdef12345678', to: '0xfedcba9876543210fedcba9876543210fedcba98', amount: 75.25, blockIndex: 140 },
  ]);

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
