export interface User {
  _id: string;
  email: string;
  name: string;
  systemUser?: boolean;
}

export interface Account {
  _id: string;
  user: string;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  balance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  _id: string;
  account: string;
  amount: number;
  transaction: string | {
    _id: string;
    fromAccount: string;
    toAccount: string;
    amount: number;
    status: string;
    idempotencyKey: string;
    createdAt: string;
  };
  type: 'CREDIT' | 'DEBIT';
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  _id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationReport {
  isReconciled: boolean;
  accountingEquation: string;
  totalCredits: number;
  totalDebits: number;
  discrepancy: number;
  entryMetrics: {
    creditEntries: number;
    debitEntries: number;
    totalLedgerEntries: number;
  };
  totalTransactions: number;
  verifiedAt: string;
}

export interface StatementResponse {
  account: {
    _id: string;
    currency: string;
    status: string;
    currentBalance: number;
  };
  entriesCount: number;
  entries: LedgerEntry[];
}
