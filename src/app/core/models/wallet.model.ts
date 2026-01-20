export interface UserProfile {
  displayName: string;
  walletName: string;
  email?: string;
}

export interface WalletData {
  publicAddress: string;
  privateKey: string;
  walletId: string;
  balance: number;
  createdAt: Date;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  blockIndex: number;
  status: 'pending' | 'confirmed' | 'failed';
  memo?: string;
  timestamp: Date;
}
