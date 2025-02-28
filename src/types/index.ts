export interface Block {
  number: string;
  hash: string;
  transactions: Transaction[];
  timestamp: string;
  gasLimit: string;
  gasUsed: string;
  parentHash: string;
  isFlashBlock: boolean;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  isUserTransaction?: boolean;
}

export interface GameBlock {
  id: string;
  blockNumber: string;
  hash: string;
  transactionCount: number;
  isFlashBlock: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  caught: boolean;
  details?: Block;
}

export interface GameState {
  score: number;
  standardBlocksCaught: number;
  flashBlocksCaught: number;
  userTransactionHash: string | null;
  userTransactionConfirmedInStandard: boolean;
  userTransactionConfirmedInFlash: boolean;
  standardConfirmationTime: number | null;
  flashConfirmationTime: number | null;
}

export interface CatcherState {
  x: number;
  width: number;
}

export interface StatsState {
  standardBlocksPerMinute: number;
  flashBlocksPerMinute: number;
  averageStandardConfirmationTime: number;
  averageFlashConfirmationTime: number;
  standardTransactionThroughput: number;
  flashTransactionThroughput: number;
}

// Add global window property for the user transaction hash
declare global {
  interface Window {
    userTxHash?: string;
  }
}
