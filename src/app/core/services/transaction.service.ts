import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  TransactionRequest,
  TransactionResponse,
  ApiTransaction,
  PendingTransactionsResponse,
} from '../models/api.interfaces';

// For client-side transaction signing using elliptic library
import { ec as EC } from 'elliptic';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  /**
   * Create transaction payload for signing
   * Format: "sender:receiver:amount"
   */
  createPayload(sender: string, receiver: string, amount: string): string {
    return `${sender}:${receiver}:${amount}`;
  }

  /**
   * SHA-256 hash using Web Crypto API
   */
  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sign a transaction with private key
   *
   * Uses the elliptic library for ECDSA signing (secp256k1 curve - same as backend)
   */
  async signTransaction(payload: string, privateKeyHex: string): Promise<string> {
    // Create EC instance with secp256k1 curve
    const ec = new EC('secp256k1');

    // Create key from private key hex
    const key = ec.keyFromPrivate(privateKeyHex, 'hex');

    // Sign the payload (hash it first with SHA-256)
    const msgHash = await this.sha256(payload);
    const signature = key.sign(msgHash);

    // Return DER-encoded signature as hex
    return signature.toDER('hex');
  }

  /**
   * Send SIFRA coins to another wallet
   *
   * @param receiverAddress - Recipient's wallet address (public key)
   * @param amount - Amount to send (as string for precision)
   * @param privateKey - Sender's private key (for signing)
   * @returns Observable with transaction response
   */
  async sendTransaction(
    receiverAddress: string,
    amount: string,
    privateKey: string,
    transactionPin: string,
  ): Promise<Observable<TransactionResponse>> {
    const walletAddress = this.auth.walletAddress();
    if (!walletAddress) {
      throw new Error('No wallet connected');
    }

    const senderAddress = walletAddress;

    // Create payload and sign it
    const payload = this.createPayload(senderAddress, receiverAddress, amount);
    const signature = await this.signTransaction(payload, privateKey);

    // Create transaction request
    const txRequest: TransactionRequest = {
      sender: senderAddress,
      receiver: receiverAddress,
      amount: amount,
      signature: signature,
      transaction_pin: transactionPin,
    };

    // Submit to API
    return this.api.submitTransaction(txRequest);
  }

  /**
   * Get transaction details by hash
   */
  getTransaction(txHash: string): Observable<ApiTransaction> {
    return this.api.getTransaction(txHash);
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): Observable<PendingTransactionsResponse> {
    return this.api.getPendingTransactions();
  }
}
