import { Injectable, signal, computed, inject } from '@angular/core';
import { UserProfile, WalletData, Transaction } from '../models/wallet.model';
import { ApiService } from './api.service';
import { tap } from 'rxjs';

const STORAGE_KEYS = {
  PROFILE: 'sifra_profile',
  WALLET: 'sifra_wallet',
  TRANSACTIONS: 'sifra_transactions',
};

@Injectable({ providedIn: 'root' })
export class WalletService {
  // State signals
  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _wallet = signal<WalletData | null>(null);
  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _marketPrice = signal<number>(0.75);
  private readonly api = inject(ApiService);

  // Public computed values
  readonly profile = computed(() => this._profile());
  readonly wallet = computed(() => this._wallet());
  readonly transactions = computed(() => this._transactions());
  readonly isOnboarded = computed(() => this._wallet() !== null);
  readonly balance = computed(() => this._wallet()?.balance ?? 0);
  readonly marketPrice = computed(() => this._marketPrice());

  constructor() {
    this.loadFromStorage();
  }

  // Profile methods
  setProfile(profile: UserProfile): void {
    this._profile.set(profile);
    this.saveToStorage(STORAGE_KEYS.PROFILE, profile);
  }

  // Wallet generation
  generateWallet(): WalletData {
    const wallet: WalletData = {
      publicAddress: this.generateAddress(),
      privateKey: this.generatePrivateKey(),
      walletId: this.generateWalletId(),
      balance: 1000, // Starting balance for demo
      createdAt: new Date(),
    };
    this._wallet.set(wallet);
    this.saveToStorage(STORAGE_KEYS.WALLET, wallet);

    // Add some demo transactions
    this.initDemoTransactions(wallet.publicAddress);

    return wallet;
  }

  // Transaction methods
  addTransaction(tx: Transaction): void {
    this._transactions.update((txs) => [tx, ...txs]);
    this.saveToStorage(STORAGE_KEYS.TRANSACTIONS, this._transactions());
  }

  sendTransaction(to: string, amount: number, memo?: string): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const wallet = this._wallet();
      if (!wallet) {
        reject(new Error('No wallet found'));
        return;
      }

      if (amount > wallet.balance) {
        reject(new Error('Insufficient balance'));
        return;
      }

      // Simulate transaction signing and sending
      setTimeout(() => {
        const tx: Transaction = {
          hash: this.generateTxHash(),
          from: wallet.publicAddress,
          to,
          amount,
          blockIndex: Math.floor(Math.random() * 1000) + 100,
          status: 'confirmed',
          memo,
          timestamp: new Date(),
        };

        // Update balance
        this._wallet.update((w) => (w ? { ...w, balance: w.balance - amount } : null));
        this.saveToStorage(STORAGE_KEYS.WALLET, this._wallet());

        // Add transaction
        this.addTransaction(tx);
        resolve(tx);
      }, 2000);
    });
  }

  // Market & Deposit methods
  updateMarketPrice(price: number): void {
    this._marketPrice.set(price);
  }

  deposit(address: string, amount: number): import('rxjs').Observable<any> {
    return this.api.deposit({ address, amount }).pipe(
      tap((response) => {
        // Refresh balance locally in mock wallet if the address matches
        this._wallet.update((w) => {
          if (w && w.publicAddress === address) {
            return { ...w, balance: w.balance + amount };
          }
          return w;
        });

        this.saveToStorage(STORAGE_KEYS.WALLET, this._wallet());

        // Add a mock transaction to history for immediate feedback
        const tx: Transaction = {
          hash: response.tx_hash,
          from: 'NETWORK',
          to: address,
          amount,
          blockIndex: 0,
          status: 'confirmed',
          memo: 'Deposit (Add Funds)',
          timestamp: new Date(),
        };
        this.addTransaction(tx);
      }),
    );
  }

  // Clear all data
  clearAllData(): void {
    this._profile.set(null);
    this._wallet.set(null);
    this._transactions.set([]);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.WALLET);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  }

  // Private methods
  private loadFromStorage(): void {
    try {
      const profile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const wallet = localStorage.getItem(STORAGE_KEYS.WALLET);
      const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

      if (profile) this._profile.set(JSON.parse(profile));
      if (wallet) this._wallet.set(JSON.parse(wallet));
      if (transactions) this._transactions.set(JSON.parse(transactions));
    } catch (e) {
      console.error('Failed to load wallet data from storage:', e);
    }
  }

  private saveToStorage(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save wallet data to storage:', e);
    }
  }

  private initDemoTransactions(address: string): void {
    const demoTxs: Transaction[] = [
      {
        hash: this.generateTxHash(),
        from: '0x9876543210fedcba9876543210fedcba98765432',
        to: address,
        amount: 500,
        blockIndex: 142,
        status: 'confirmed',
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        hash: this.generateTxHash(),
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: address,
        amount: 250,
        blockIndex: 138,
        status: 'confirmed',
        timestamp: new Date(Date.now() - 172800000),
      },
    ];
    this._transactions.set(demoTxs);
    this.saveToStorage(STORAGE_KEYS.TRANSACTIONS, demoTxs);
  }

  private generateAddress(): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  private generatePrivateKey(): string {
    const chars = '0123456789abcdef';
    let key = '';
    for (let i = 0; i < 64; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  }

  private generateWalletId(): string {
    return 'SIFRA-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private generateTxHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }
}
