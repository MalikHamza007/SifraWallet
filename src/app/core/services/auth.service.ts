import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  User,
  WalletCredentials,
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  RecoverResponse,
} from '../models/api.interfaces';

const STORAGE_KEYS = {
  USER: 'sifra_user',
  WALLET: 'sifra_wallet_credentials',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  // State signals
  private readonly _currentUser = signal<User | null>(null);
  private readonly _wallet = signal<WalletCredentials | null>(null);

  // Temporary private key storage (for signing transactions)
  private tempPrivateKey: string | null = null;

  // Public computed values
  readonly currentUser = computed(() => this._currentUser());
  readonly wallet = computed(() => this._wallet());
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly walletAddress = computed(() => this._wallet()?.address ?? null);

  constructor() {
    this.loadStoredSession();
  }

  // ===========================================================================
  // Session Management
  // ===========================================================================

  private loadStoredSession(): void {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const storedWallet = localStorage.getItem(STORAGE_KEYS.WALLET);

      if (storedUser) {
        this._currentUser.set(JSON.parse(storedUser));
      }
      if (storedWallet) {
        this._wallet.set(JSON.parse(storedWallet));
      }
    } catch (e) {
      console.error('Failed to load session from storage:', e);
    }
  }

  private saveSession(user: User, wallet: WalletCredentials): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
      this._currentUser.set(user);
      this._wallet.set(wallet);
    } catch (e) {
      console.error('Failed to save session to storage:', e);
    }
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.WALLET);
    this._currentUser.set(null);
    this._wallet.set(null);
    this.tempPrivateKey = null;
  }

  // ===========================================================================
  // Authentication Methods
  // ===========================================================================

  /**
   * Register a new user
   *
   * ⚠️ IMPORTANT: This returns mnemonic and private key ONLY ONCE!
   * The frontend MUST display these to the user with a strong warning.
   */
  signup(data: SignupRequest): Observable<SignupResponse> {
    return this.api.signup(data).pipe(
      tap((response) => {
        // Store user info and wallet address (but NOT private key or mnemonic!)
        const user: User = response.user;
        const wallet: WalletCredentials = {
          address: response.wallet.address,
        };

        this.saveSession(user, wallet);

        // NOTE: The component must handle displaying mnemonic + private key!
        // This service does NOT store the private key.
      })
    );
  }

  /**
   * Login existing user
   */
  login(data: LoginRequest): Observable<LoginResponse> {
    return this.api.login(data).pipe(
      tap((response) => {
        const user: User = response.user;
        const wallet: WalletCredentials = {
          address: response.wallet.address,
        };

        this.saveSession(user, wallet);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.api.logout().subscribe({
      next: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Clear session anyway on error
        this.clearSession();
        this.router.navigate(['/login']);
      },
    });
  }

  /**
   * Recover private key from mnemonic phrase
   */
  recoverKey(mnemonic: string): Observable<RecoverResponse> {
    return this.api.recoverKey(mnemonic);
  }

  // ===========================================================================
  // Temporary Private Key Management (for transaction signing)
  // ===========================================================================

  /**
   * Store private key temporarily in memory (for signing transactions)
   * ⚠️ WARNING: This should only be stored temporarily and cleared after use!
   */
  setTempPrivateKey(privateKey: string): void {
    this.tempPrivateKey = privateKey;
  }

  getTempPrivateKey(): string | null {
    return this.tempPrivateKey;
  }

  clearTempPrivateKey(): void {
    this.tempPrivateKey = null;
  }
}
