import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  UserResponse,
  RecoverResponse,
  WalletInfo,
  BalanceResponse,
  WalletTransactionsResponse,
  KeypairResponse,
  TransactionRequest,
  TransactionResponse,
  ApiTransaction,
  PendingTransactionsResponse,
  ChainInfo,
  ChainResponse,
  ValidationResponse,
  Block,
  MineResponse,
  ManualMineResponse,
  DepositRequest,
  DepositResponse,
  MarketPriceResponse,
} from '../models/api.interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ===========================================================================
  // Generic HTTP methods
  // ===========================================================================

  private get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  private post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data);
  }

  // ===========================================================================
  // AUTH ENDPOINTS
  // ===========================================================================

  signup(data: SignupRequest): Observable<SignupResponse> {
    return this.post<SignupResponse>('/auth/signup/', data);
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.post<LoginResponse>('/auth/login/', data);
  }

  logout(): Observable<{ message: string }> {
    return this.post<{ message: string }>('/auth/logout/', {});
  }

  getCurrentUser(): Observable<UserResponse> {
    return this.get<UserResponse>('/auth/me/');
  }

  recoverKey(mnemonic: string): Observable<RecoverResponse> {
    return this.post<RecoverResponse>('/auth/recover/', { mnemonic });
  }

  // ===========================================================================
  // WALLET ENDPOINTS
  // ===========================================================================

  getWallet(address: string): Observable<WalletInfo> {
    return this.get<WalletInfo>(`/wallet/${address}/`);
  }

  getBalance(address: string): Observable<BalanceResponse> {
    return this.get<BalanceResponse>(`/wallet/${address}/balance/`);
  }

  getWalletTransactions(address: string): Observable<WalletTransactionsResponse> {
    return this.get<WalletTransactionsResponse>(`/wallet/${address}/transactions/`);
  }

  generateKeypair(): Observable<KeypairResponse> {
    return this.get<KeypairResponse>('/keypair/');
  }

  // ===========================================================================
  // TRANSACTION ENDPOINTS
  // ===========================================================================

  submitTransaction(data: TransactionRequest): Observable<TransactionResponse> {
    return this.post<TransactionResponse>('/transaction/', data);
  }

  getTransaction(txHash: string): Observable<ApiTransaction> {
    return this.get<ApiTransaction>(`/transaction/${txHash}/`);
  }

  getPendingTransactions(): Observable<PendingTransactionsResponse> {
    return this.get<PendingTransactionsResponse>('/transactions/pending/');
  }

  // ===========================================================================
  // BLOCKCHAIN ENDPOINTS
  // ===========================================================================

  getChainInfo(): Observable<ChainInfo> {
    return this.get<ChainInfo>('/info/');
  }

  getChain(): Observable<ChainResponse> {
    return this.get<ChainResponse>('/chain/');
  }

  validateChain(): Observable<ValidationResponse> {
    return this.get<ValidationResponse>('/validate/');
  }

  getBlock(index: number): Observable<Block> {
    return this.get<Block>(`/block/${index}/`);
  }

  createGenesis(): Observable<{ message: string }> {
    return this.post<{ message: string }>('/genesis/', {});
  }

  mineBlock(payload: {
    miner_address: string;
    transaction_ids?: number[];
  }): Observable<MineResponse> {
    return this.post<MineResponse>('/mine/', payload);
  }

  manualMine(): Observable<ManualMineResponse> {
    return this.post<ManualMineResponse>('/block/', {});
  }

  // ===========================================================================
  // MARKET & DEPOSIT ENDPOINTS
  // ===========================================================================

  deposit(data: DepositRequest): Observable<DepositResponse> {
    return this.post<DepositResponse>('/deposit/', data);
  }

  getMarketPrice(): Observable<MarketPriceResponse> {
    return this.get<MarketPriceResponse>('/market/');
  }
}
