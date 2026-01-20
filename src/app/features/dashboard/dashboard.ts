import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import {
  WalletTransactionsResponse,
  BalanceResponse,
  ChainInfo,
  ChainResponse,
  Block,
  ApiTransaction,
} from '../../core/models/api.interfaces';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <div class="container">
        <!-- Welcome Header -->
        <div class="welcome-section">
          <h1 class="welcome-title">
            Welcome back,
            <span class="accent">{{ authService.currentUser()?.username || 'User' }}</span>
          </h1>
          <p class="welcome-subtitle">SIFRA Wallet</p>
        </div>

        <!-- Balance Card -->
        <div class="balance-card">
          <div class="balance-header">
            <span class="balance-label">Total Balance</span>
            <button class="refresh-btn" (click)="refreshBalance()" [disabled]="isLoadingBalance()">
              {{ isLoadingBalance() ? '⟳' : '↻' }}
            </button>
          </div>
          <div class="balance-amount">
            <span class="amount">{{ balance() | number: '1.2-2' }}</span>
            <span class="currency">SFR</span>
          </div>
          <div class="balance-address">
            <span class="address-label">Address:</span>
            <span class="address-value">{{
              formatAddress(authService.walletAddress() || '')
            }}</span>
            <button class="copy-btn-small" (click)="copyAddress()">
              {{ copied() ? '✓' : '⧉' }}
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
          <h2 class="section-title">Quick Actions</h2>
          <div class="actions-grid">
            <a routerLink="/send" class="action-card">
              <span class="action-icon send">↗</span>
              <span class="action-label">Send</span>
              <span class="action-desc">Transfer SFR</span>
            </a>
            <a routerLink="/receive" class="action-card">
              <span class="action-icon receive">↙</span>
              <span class="action-label">Receive</span>
              <span class="action-desc">Get SFR</span>
            </a>
            <a routerLink="/history" class="action-card">
              <span class="action-icon history">☰</span>
              <span class="action-label">History</span>
              <span class="action-desc">View transactions</span>
            </a>
            <a routerLink="/add-funds" class="action-card">
              <span class="action-icon add">⊕</span>
              <span class="action-label">Add Funds</span>
              <span class="action-desc">Buy SIFRA</span>
            </a>
          </div>
        </div>

        <!-- Network Stats -->
        @if (chainInfo()) {
          <div class="stats-card">
            <h3 class="section-title">Network Stats</h3>
            <div class="stats-grid">
              <div class="stat">
                <span class="value">{{ chainInfo()?.block_count }}</span>
                <span class="label">Blocks</span>
              </div>
              <div class="stat">
                <span class="value">{{ chainInfo()?.transaction_count }}</span>
                <span class="label">Transactions</span>
              </div>
              <div class="stat">
                <span class="value">{{ chainInfo()?.wallet_count }}</span>
                <span class="label">Wallets</span>
              </div>
              <div class="stat">
                <span class="value">{{ chainInfo()?.pending_transactions }}</span>
                <span class="label">Pending</span>
              </div>
            </div>
          </div>
        }

        <!-- Recent Transactions -->
        <div class="recent-section">
          <div class="section-header">
            <h2 class="section-title">Recent Transactions</h2>
            <a routerLink="/history" class="view-all">View All →</a>
          </div>

          <!-- Network Control (Manual Mining) -->
          <div class="card network-control">
            <h3 class="section-title">Blockchain Network Control</h3>
            <p class="section-desc">Manual block creation for network maintenance and testing.</p>

            <div class="mining-btn-wrapper">
              <button
                class="btn btn-mine"
                (click)="onMine()"
                [disabled]="isMining()"
                [class.processing]="isMining()"
              >
                <span class="btn-icon">{{ isMining() ? '⚙' : '⛏' }}</span>
                <span class="btn-text">
                  @if (isMining()) {
                    Hashing & Solving Puzzle...
                  } @else {
                    Start Mining Blocks
                  }
                </span>
              </button>
            </div>

            @if (miningMessage()) {
              <div class="mining-toast success">
                <span class="toast-icon">✨</span>
                <span class="toast-text">{{ miningMessage() }}</span>
              </div>
            }
            @if (miningError()) {
              <div class="mining-toast error">
                <span class="toast-icon">⚠️</span>
                <span class="toast-text">{{ miningError() }}</span>
              </div>
            }

            <!-- Mining Animation Overlay -->
            @if (isMining() || isMiningAnimation()) {
              <div class="mining-overlay">
                <div class="mining-engine">
                  <div class="engine-core">
                    <div class="hash-display">
                      <span class="hash-label">Generating Block Hash...</span>
                      <code class="hash-text">{{ animatedBlockHash() }}</code>
                    </div>
                    <div class="engine-visual">
                      <div class="cube-container">
                        <div class="cube">
                          <div class="face front"></div>
                          <div class="face back"></div>
                          <div class="face right"></div>
                          <div class="face left"></div>
                          <div class="face top"></div>
                          <div class="face bottom"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="engine-status">{{ miningPhase() }}</div>
                </div>
              </div>
            }
          </div>

          @if (isLoadingTx()) {
            <div class="loading-state">Loading transactions...</div>
          } @else if (transactions().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📭</span>
              <p>No transactions yet</p>
            </div>
          } @else {
            <div class="tx-list">
              @for (tx of transactions().slice(0, 5); track tx.tx_hash) {
                <div class="tx-item">
                  <div class="tx-icon" [class.incoming]="isIncoming(tx)">
                    {{ isIncoming(tx) ? '↙' : '↗' }}
                  </div>
                  <div class="tx-details">
                    <span class="tx-type">{{ isIncoming(tx) ? 'Received' : 'Sent' }}</span>
                    <span class="tx-hash">{{ formatHash(tx.tx_hash) }}</span>
                  </div>
                  <div class="tx-amount" [class.incoming]="isIncoming(tx)">
                    {{ isIncoming(tx) ? '+' : '-' }}{{ tx.amount }} SFR
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Recent Blocks (PoW Proof) -->
        <div class="recent-section">
          <div class="section-header">
            <h2 class="section-title">Verified Blocks (PoW)</h2>
            <span class="view-all">Proofs Found</span>
          </div>

          @if (isLoadingBlocks()) {
            <div class="loading-state">Syncing ledger...</div>
          } @else if (blocks().length === 0) {
            <div class="empty-state">No blocks mined yet</div>
          } @else {
            <div class="block-table-wrapper">
              <table class="block-table">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Hash (Proof)</th>
                    <th>Nonce</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  @for (block of blocks(); track block.index) {
                    <tr>
                      <td>#{{ block.index }}</td>
                      <td class="hash-cell">
                        <span class="proof-prefix">0000</span>{{ block.hash.slice(4, 10) }}...
                      </td>
                      <td class="nonce-cell">{{ block.nonce }}</td>
                      <td>{{ block.transactions_count }} TXs</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Logout Button -->
        <div class="logout-section">
          <button class="btn btn-secondary btn-block" (click)="logout()">Logout</button>
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
        max-width: 800px;
        margin: 0 auto;
      }
      .welcome-title {
        font-size: 24px;
        margin-bottom: 4px;
      }
      .accent {
        color: var(--color-accent);
      }
      .welcome-subtitle {
        color: var(--color-text-muted);
        margin: 0;
      }
      .balance-card {
        background: linear-gradient(
          135deg,
          var(--color-surface) 0%,
          var(--color-surface-light) 100%
        );
        border: 1px solid var(--color-accent);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
      }
      .balance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .balance-label {
        color: var(--color-text-secondary);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .refresh-btn {
        background: none;
        border: 1px solid var(--color-surface-border);
        color: var(--color-text-muted);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
      }
      .refresh-btn:hover:not(:disabled) {
        border-color: var(--color-accent);
        color: var(--color-accent);
      }
      .refresh-btn:disabled {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .balance-amount {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 16px;
      }
      .amount {
        font-size: 48px;
        font-weight: 700;
        color: var(--color-accent);
      }
      .currency {
        font-size: 20px;
        color: var(--color-text-secondary);
      }
      .balance-address {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }
      .address-value {
        font-family: monospace;
        color: var(--color-text-secondary);
      }
      .copy-btn-small {
        background: none;
        border: none;
        color: var(--color-accent);
        cursor: pointer;
      }
      .section-title {
        font-size: 18px;
        margin-bottom: 16px;
      }
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .action-card {
        background: var(--color-surface);
        border: 1px solid var(--color-surface-border);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        text-decoration: none;
        transition: 0.2s;
      }
      .action-card:hover {
        border-color: var(--color-accent);
        transform: translateY(-2px);
      }
      .action-icon {
        display: block;
        font-size: 32px;
        margin-bottom: 8px;
      }
      .action-icon.send {
        color: #ff6b6b;
      }
      .action-icon.receive {
        color: var(--color-accent);
      }
      .action-icon.history {
        color: var(--color-info);
      }
      .action-icon.add {
        color: #00c6ff;
      }
      .action-label {
        display: block;
        font-weight: 600;
        color: #fff;
        margin-bottom: 4px;
      }
      .action-desc {
        font-size: 12px;
        color: var(--color-text-muted);
      }
      .stats-card {
        background: var(--color-surface);
        border: 1px solid var(--color-surface-border);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }
      .stat {
        text-align: center;
      }
      .stat .value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: var(--color-accent);
      }
      .stat .label {
        font-size: 12px;
        color: var(--color-text-muted);
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .view-all {
        color: var(--color-accent);
        text-decoration: none;
        font-size: 13px;
      }
      .tx-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .tx-item {
        display: flex;
        align-items: center;
        gap: 16px;
        background: var(--color-surface);
        border-radius: 8px;
        padding: 12px;
      }
      .tx-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 107, 107, 0.1);
        color: #ff6b6b;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      .tx-icon.incoming {
        background: rgba(42, 215, 146, 0.1);
        color: var(--color-accent);
      }
      .tx-details {
        flex: 1;
      }
      .tx-type {
        font-weight: 500;
        font-size: 14px;
      }
      .tx-hash {
        font-size: 12px;
        font-family: monospace;
        color: var(--color-text-muted);
      }
      .tx-amount {
        font-weight: 600;
        color: #ff6b6b;
      }
      .tx-amount.incoming {
        color: var(--color-accent);
      }
      .empty-state {
        text-align: center;
        padding: 24px;
        color: var(--color-text-muted);
      }
      .logout-section {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--color-surface-border);
      }
      .block-table-wrapper {
        background: var(--color-surface);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--color-surface-border);
        margin-bottom: 24px;
      }
      .block-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .block-table th,
      .block-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid var(--color-surface-border);
      }
      .block-table th {
        background: var(--color-surface-light);
        color: var(--color-text-muted);
        text-transform: uppercase;
        font-size: 10px;
      }
      .hash-cell {
        font-family: monospace;
        color: var(--color-accent);
      }
      .proof-prefix {
        background: rgba(42, 215, 146, 0.2);
        padding: 2px 4px;
        border-radius: 2px;
        margin-right: 2px;
      }
      .nonce-cell {
        color: #ffb84d;
        font-weight: 600;
      }
      @media (max-width: 768px) {
        .amount {
          font-size: 36px;
        }
        .actions-grid {
          grid-template-columns: 1fr;
        }
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .network-control {
        background: linear-gradient(135deg, var(--color-surface) 0%, #1a1b26 100%);
        border: 1px dashed var(--color-accent);
        padding: 24px;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      }
      .section-desc {
        color: var(--color-text-muted);
        font-size: 13px;
        margin-bottom: 16px;
      }
      .btn-mine {
        background: linear-gradient(90deg, var(--color-accent) 0%, #7e57c2 100%);
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 30px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 15px rgba(124, 77, 255, 0.3);
        transition: 0.3s;
        cursor: pointer;
      }
      .btn-mine:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(124, 77, 255, 0.4);
      }
      .btn-mine.processing {
        opacity: 0.7;
        cursor: wait;
      }
      .mining-toast {
        margin-top: 16px;
        padding: 12px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: fadeIn 0.3s;
      }
      .mining-toast.success {
        background: rgba(0, 230, 118, 0.1);
        border: 1px solid #00e676;
        color: #00e676;
      }
      .mining-toast.error {
        background: rgba(255, 77, 77, 0.1);
        border: 1px solid var(--color-error);
        color: var(--color-error);
      }
      .mining-overlay {
        position: absolute;
        inset: 0;
        background: rgba(10, 11, 16, 0.9);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        animation: fadeInOverlay 0.4s;
      }
      .mining-engine {
        width: 100%;
        max-width: 380px;
        text-align: center;
      }
      .hash-display {
        background: #000;
        padding: 12px;
        border: 1px solid var(--color-accent);
        text-align: left;
        margin-bottom: 20px;
      }
      .hash-label {
        display: block;
        font-size: 10px;
        color: var(--color-text-muted);
        text-transform: uppercase;
      }
      .hash-text {
        font-family: monospace;
        font-size: 11px;
        color: var(--color-accent);
        word-break: break-all;
      }
      .engine-visual {
        display: flex;
        justify-content: center;
        perspective: 1000px;
        margin-bottom: 20px;
      }
      .cube-container {
        width: 50px;
        height: 50px;
        position: relative;
        transform-style: preserve-3d;
      }
      .cube {
        width: 100%;
        height: 100%;
        position: absolute;
        transform-style: preserve-3d;
        animation: rotateCube 3s linear infinite;
      }
      .face {
        position: absolute;
        width: 50px;
        height: 50px;
        background: rgba(42, 215, 146, 0.1);
        border: 1px solid var(--color-accent);
        box-shadow: 0 0 8px var(--color-accent);
      }
      .front {
        transform: translateZ(25px);
      }
      .back {
        transform: rotateY(180deg) translateZ(25px);
      }
      .right {
        transform: rotateY(90deg) translateZ(25px);
      }
      .left {
        transform: rotateY(-90deg) translateZ(25px);
      }
      .top {
        transform: rotateX(90deg) translateZ(25px);
      }
      .bottom {
        transform: rotateX(-90deg) translateZ(25px);
      }
      @keyframes rotateCube {
        to {
          transform: rotateX(360deg) rotateY(360deg);
        }
      }
      .engine-status {
        color: #fff;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        animation: pulseStatus 1.5s infinite;
      }
      @keyframes pulseStatus {
        50% {
          opacity: 0.5;
        }
      }
      @keyframes fadeInOverlay {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);

  // State
  protected readonly balance = signal(0);
  protected readonly transactions = signal<ApiTransaction[]>([]);
  protected readonly blocks = signal<Block[]>([]);
  protected readonly chainInfo = signal<ChainInfo | null>(null);
  protected readonly isLoadingBalance = signal(false);
  protected readonly isLoadingTx = signal(false);
  protected readonly isLoadingBlocks = signal(false);
  protected readonly isMining = signal(false);
  protected readonly isMiningAnimation = signal(false);
  protected readonly miningMessage = signal('');
  protected readonly miningError = signal('');
  protected readonly miningPhase = signal('');
  protected readonly animatedBlockHash = signal('');
  protected readonly copied = signal(false);

  ngOnInit(): void {
    this.loadBalance();
    this.loadTransactions();
    this.loadBlocks();
    this.loadChainInfo();
  }

  loadBalance(): void {
    const address = this.authService.walletAddress();
    if (!address) return;

    this.isLoadingBalance.set(true);
    this.apiService.getBalance(address).subscribe({
      next: (response: BalanceResponse) => {
        this.balance.set(parseFloat(response.balance));
        this.isLoadingBalance.set(false);
      },
      error: () => {
        this.isLoadingBalance.set(false);
      },
    });
  }

  refreshBalance(): void {
    this.loadBalance();
  }

  loadTransactions(): void {
    const address = this.authService.walletAddress();
    if (!address) return;

    this.isLoadingTx.set(true);
    this.apiService.getWalletTransactions(address).subscribe({
      next: (response: WalletTransactionsResponse) => {
        this.transactions.set(response.transactions);
        this.isLoadingTx.set(false);
      },
      error: () => {
        this.isLoadingTx.set(false);
      },
    });
  }

  loadBlocks(): void {
    this.isLoadingBlocks.set(true);
    this.apiService.getChain().subscribe({
      next: (response: ChainResponse) => {
        // Show last 5 blocks, reversed to see newest first
        this.blocks.set(response.chain.slice(-5).reverse());
        this.isLoadingBlocks.set(false);
      },
      error: () => {
        this.isLoadingBlocks.set(false);
      },
    });
  }

  loadChainInfo(): void {
    this.apiService.getChainInfo().subscribe({
      next: (info) => {
        this.chainInfo.set(info);
      },
    });
  }

  onMine(): void {
    if (this.isMining()) return;

    const minerAddress = this.authService.walletAddress();
    if (!minerAddress) {
      this.miningError.set('Wallet address not found. Please login again.');
      return;
    }

    this.isMining.set(true);
    this.miningMessage.set('');
    this.miningError.set('');
    this.isMiningAnimation.set(true);
    this.miningPhase.set('Initializing Mining Engine...');

    // Start block hashing animation
    this.startHashingAnimation();

    setTimeout(() => {
      this.miningPhase.set('Hashing & Solving Puzzle...');

      const payload = { miner_address: minerAddress };

      this.apiService.mineBlock(payload).subscribe({
        next: (response) => {
          this.miningPhase.set('Nonce Found! Block Created.');
          this.miningMessage.set(`Success! Nonce found: ${response.nonce}`);

          setTimeout(() => {
            this.isMining.set(false);
            this.isMiningAnimation.set(false);
            this.loadBalance();
            this.loadTransactions();
            this.loadBlocks();
            this.loadChainInfo();
          }, 1500);

          setTimeout(() => this.miningMessage.set(''), 8000);
        },
        error: (err) => {
          this.isMining.set(false);
          this.isMiningAnimation.set(false);
          const errorMsg =
            err.error?.error || err.error?.detail || 'Mining failed. No pending transactions?';
          this.miningError.set(errorMsg);
          console.error('Mining failed:', err);

          setTimeout(() => this.miningError.set(''), 8000);
        },
      });
    }, 2500);
  }

  private startHashingAnimation(): void {
    const hex = '0123456789abcdef';
    let iterations = 0;
    const interval = setInterval(() => {
      let hash = '00000000';
      for (let i = 0; i < 64; i++) {
        hash += hex[Math.floor(Math.random() * 16)];
      }
      this.animatedBlockHash.set(hash);

      iterations++;
      if (iterations > 50 || !this.isMiningAnimation()) {
        clearInterval(interval);
      }
    }, 50);
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  formatHash(hash: string): string {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  }

  isIncoming(tx: ApiTransaction): boolean {
    return tx.receiver === this.authService.walletAddress();
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

  logout(): void {
    this.authService.logout();
  }
}
