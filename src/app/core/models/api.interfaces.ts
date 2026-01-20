// =============================================================================
// Auth Interfaces
// =============================================================================

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  transaction_pin: string;
}

export interface SignupResponse {
  message: string;
  user: User;
  wallet: {
    address: string;
    public_key: string;
    private_key: string;
    mnemonic: string;
  };
  warning: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  wallet: {
    address: string;
    balance: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface UserResponse {
  user: User;
  wallet: {
    address: string;
    balance: string;
    created_at: string;
  };
}

export interface RecoverResponse {
  message: string;
  public_key: string;
  private_key: string;
  wallet_exists: boolean;
  balance?: string;
}

// =============================================================================
// Wallet Interfaces
// =============================================================================

export interface WalletCredentials {
  address: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  created_at: string;
}

export interface BalanceResponse {
  address: string;
  balance: string;
}

export interface DepositRequest {
  address: string;
  amount: number;
}

export interface DepositResponse {
  tx_hash: string;
  message: string;
}

export interface MarketPriceResponse {
  current_price_usd: number;
}

export interface KeypairResponse {
  private_key: string;
  public_key: string;
  warning: string;
}

// =============================================================================
// Transaction Interfaces
// =============================================================================

export interface TransactionRequest {
  sender: string;
  receiver: string;
  amount: string;
  signature: string;
  transaction_pin: string;
}

export interface TransactionResponse {
  tx_hash: string;
  status: string;
  sender: string;
  receiver: string;
  amount: string;
  message: string;
}

export interface ApiTransaction {
  tx_hash: string;
  sender: string;
  receiver: string;
  amount: string;
  status: 'pending' | 'confirmed';
  timestamp: string;
  signature?: string;
}

export interface WalletTransactionsResponse {
  address: string;
  transaction_count: number;
  transactions: ApiTransaction[];
}

export interface PendingTransactionsResponse {
  count: number;
  transactions: ApiTransaction[];
}

// =============================================================================
// Blockchain Interfaces
// =============================================================================

export interface ChainInfo {
  block_count: number;
  transaction_count: number;
  pending_transactions: number;
  confirmed_transactions: number;
  wallet_count: number;
  latest_block_index: number;
  latest_block_hash: string;
  genesis_supply: string;
}

export interface Block {
  index: number;
  hash: string;
  previous_hash: string;
  nonce: number;
  timestamp: string;
  is_genesis: boolean;
  transactions_count: number;
  transactions: ApiTransaction[];
}

export interface ChainResponse {
  length: number;
  chain: Block[];
}

export interface ValidationResponse {
  valid: boolean;
  error: string | null;
  message: string;
  blocks_checked: number;
}

export interface MineResponse {
  message: string;
  block_index: number;
  block_hash: string;
  previous_hash: string;
  nonce: number;
  timestamp: string;
  transactions_count: number;
  transactions: ApiTransaction[];
}

export interface ManualMineResponse {
  message: string;
  index: number;
  hash: string;
  transactions_included: number;
}
