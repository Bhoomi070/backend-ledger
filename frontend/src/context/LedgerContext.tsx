'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Account, ReconciliationReport } from '@/types/ledger';
import { apiRequest } from '@/lib/api';

interface ToastData {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface LedgerContextType {
  currentUser: User | null;
  accounts: Account[];
  reconciliation: ReconciliationReport | null;
  isLoading: boolean;
  refreshAccounts: () => Promise<void>;
  refreshReconciliation: () => Promise<void>;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  showToast: (message: string, type?: ToastData['type']) => void;
  toast: ToastData | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isFaucetModalOpen: boolean;
  setIsFaucetModalOpen: (open: boolean) => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await apiRequest<{ accounts: Account[] }>('/accounts');
      setAccounts(data.accounts || []);
    } catch {
      // not logged in or server down
    }
  }, []);

  const refreshReconciliation = useCallback(async () => {
    try {
      const data = await apiRequest<ReconciliationReport>('/transactions/reconciliation');
      setReconciliation(data);
    } catch {
      // offline
    }
  }, []);

  const checkCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<{ user: User }>('/auth/me');
      setCurrentUser(data.user);
      await refreshAccounts();
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccounts]);

  const login = (user: User, token: string) => {
    localStorage.setItem('ledger_token', token);
    setCurrentUser(user);
    refreshAccounts();
    refreshReconciliation();
    setIsAuthModalOpen(false);
    showToast(`Welcome, ${user.name}!`, 'success');
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('ledger_token');
    setCurrentUser(null);
    setAccounts([]);
    showToast('Signed out successfully', 'info');
  };

  useEffect(() => {
    checkCurrentUser();
    refreshReconciliation();
    const interval = setInterval(refreshReconciliation, 30000);
    return () => clearInterval(interval);
  }, [checkCurrentUser, refreshReconciliation]);

  return (
    <LedgerContext.Provider
      value={{
        currentUser,
        accounts,
        reconciliation,
        isLoading,
        refreshAccounts,
        refreshReconciliation,
        login,
        logout,
        showToast,
        toast,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isFaucetModalOpen,
        setIsFaucetModalOpen,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
}
