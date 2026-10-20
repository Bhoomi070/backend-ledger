'use client';

import React, { useState } from 'react';
import { useLedger } from '@/context/LedgerContext';
import { apiRequest, formatCurrency } from '@/lib/api';
import { X, Coins } from 'lucide-react';

export function FaucetModal() {
  const {
    isFaucetModalOpen,
    setIsFaucetModalOpen,
    accounts,
    refreshAccounts,
    refreshReconciliation,
    showToast,
  } = useLedger();

  const [selectedAcc, setSelectedAcc] = useState<string>(accounts[0]?._id || '');
  const [amount, setAmount] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isFaucetModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcc) return showToast('Please select a target account', 'warning');
    setLoading(true);
    try {
      await apiRequest('/accounts/faucet', {
        method: 'POST',
        body: JSON.stringify({ accountId: selectedAcc, amount }),
      });
      setIsFaucetModalOpen(false);
      showToast(`Deposited ${formatCurrency(amount)} into sandbox account`, 'success');
      await refreshAccounts();
      await refreshReconciliation();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deposit failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-xl flex flex-col gap-4 text-zinc-900 dark:text-zinc-100">
        
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-sm">Fund Sandbox Account</h3>
          </div>
          <button
            onClick={() => setIsFaucetModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Injects test funds into your sandbox wallet by debiting the central reserve account, ensuring double-entry parity is preserved.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Target Account</label>
            <select
              value={selectedAcc || accounts[0]?._id || ''}
              onChange={(e) => setSelectedAcc(e.target.value)}
              required
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc._id.slice(0, 10)}... ({formatCurrency(acc.balance, acc.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              min={10}
              max={100000}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium text-xs py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Crediting...' : 'Deposit Funds'}
          </button>
        </form>
      </div>
    </div>
  );
}
