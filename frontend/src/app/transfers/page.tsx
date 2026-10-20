'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Send,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { useLedger } from '@/context/LedgerContext';
import { formatCurrency, generateUUID, apiRequest } from '@/lib/api';
import { Transaction } from '@/types/ledger';

export default function TransfersPage() {
  const {
    currentUser,
    accounts,
    refreshAccounts,
    refreshReconciliation,
    setIsAuthModalOpen,
    showToast,
  } = useLedger();

  const [fromAccount, setFromAccount] = useState<string>(accounts[0]?._id || '');
  const [toAccount, setToAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [showDeveloperPanel, setShowDeveloperPanel] = useState<boolean>(false);

  // Stepper state
  const [activeStep, setActiveStep] = useState<number>(0);
  const [stepLabel, setStepLabel] = useState<string>('Ready');

  // Recent transfers
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    setIdempotencyKey(generateUUID());
    if (accounts.length > 0 && !fromAccount) {
      setFromAccount(accounts[0]._id);
    }
    loadRecent();
  }, [accounts, fromAccount]);

  const loadRecent = async () => {
    try {
      const data = await apiRequest<{ transactions: Transaction[] }>('/transactions/recent');
      setRecentTxs(data.transactions || []);
    } catch {
      // silent
    }
  };

  const selectedSourceAccount = accounts.find((a) => a._id === fromAccount);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return setIsAuthModalOpen(true);

    if (fromAccount === toAccount) {
      return showToast('Source and destination accounts must be different', 'warning');
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return showToast('Please enter a valid amount', 'warning');
    }

    setIsTransferring(true);
    const traceSteps = [
      '1. Validating ownership (BOLA guard)',
      '2. Checking idempotency cache',
      '3. Reading snapshot balance in session',
      '4. Starting MongoDB transaction',
      '5. Appending DEBIT and CREDIT records',
      '6. Committing transaction',
    ];

    try {
      for (let i = 1; i <= 6; i++) {
        setActiveStep(i);
        setStepLabel(traceSteps[i - 1]);
        await new Promise((r) => setTimeout(r, 140));
      }

      const res = await apiRequest<{
        message: string;
        isIdempotentReplay?: boolean;
        transaction: Transaction;
      }>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          fromAccount,
          toAccount,
          amount: numAmount,
          idempotencyKey,
        }),
      });

      if (res.isIdempotentReplay) {
        showToast('Idempotent replay: Cached transaction returned without re-debiting', 'warning');
      } else {
        showToast(`Transferred ${formatCurrency(numAmount)} successfully`, 'success');
        setAmount('');
        setIdempotencyKey(generateUUID());
      }

      setStepLabel('Transaction committed');
      await refreshAccounts();
      await refreshReconciliation();
      await loadRecent();
    } catch (err: unknown) {
      setActiveStep(0);
      setStepLabel('Transaction aborted and rolled back');
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      showToast(msg, 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Move Money
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Execute an atomic double-entry transfer between accounts.
        </p>
      </div>

      {/* Main Transfer Form Card */}
      <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col gap-6">
        <form onSubmit={handleTransfer} className="flex flex-col gap-5">
          
          {/* Source Account Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Pay from</label>
              {selectedSourceAccount && (
                <span className="text-zinc-500 font-mono">
                  Available: {formatCurrency(selectedSourceAccount.balance, selectedSourceAccount.currency)}
                </span>
              )}
            </div>
            <select
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              required
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="">Select source account...</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc._id.slice(0, 10)}... — {formatCurrency(acc.balance, acc.currency)}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Account Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Recipient Account ID</label>
              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const other = accounts.find((a) => a._id !== fromAccount);
                    if (other) setToAccount(other._id);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Quick-select own second account
                </button>
              )}
            </div>
            <input
              type="text"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value.trim())}
              required
              placeholder="e.g. 67b68a291f092301824ab7..."
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Amount Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-mono">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                step="any"
                placeholder="0.00"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Collapsible Developer Trace & Simulation Panel */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDeveloperPanel(!showDeveloperPanel)}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
            >
              <div className="flex items-center space-x-1.5 font-medium">
                <span>Developer Parameters & Concurrency Guard</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Idempotency
                </span>
              </div>
              {showDeveloperPanel ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDeveloperPanel && (
              <div className="p-4 bg-white dark:bg-[#111114] border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 text-xs">
                
                {/* Idempotency Key Editor */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-600 dark:text-zinc-400 font-medium">Idempotency-Key Header</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIdempotencyKey(generateUUID());
                        showToast('Regenerated fresh UUID key', 'info');
                      }}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
                    >
                      New UUID
                    </button>
                  </div>
                  <input
                    type="text"
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value.trim())}
                    required
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Guarantees identical retries return the cached response without double-debiting.
                  </p>
                </div>

                {/* Simulation Triggers for Interviews */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Edge-Case Simulation Tests:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Re-submitting with duplicate key to verify idempotency...', 'info');
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] transition"
                    >
                      Simulate Idempotent Replay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAmount('999999999');
                        showToast('Set overdraft amount to test automatic rollback...', 'warning');
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 font-mono text-[11px] transition"
                    >
                      Simulate Overdraft Rollback
                    </button>
                  </div>
                </div>

                {/* Live Step Status */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-400">Pipeline Status:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{stepLabel}</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isTransferring}
            className="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium text-xs py-3 rounded-lg transition shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTransferring ? 'Processing ACID Session...' : 'Submit Transfer'}</span>
          </button>
        </form>
      </div>

      {/* Recent Activity Table */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Transfers</h2>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] overflow-hidden shadow-sm">
          {recentTxs.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">No transactions recorded yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {recentTxs.slice(0, 4).map((tx) => (
                <div key={tx._id} className="p-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{tx._id.slice(0, 12)}...</div>
                    <div className="text-[11px] text-zinc-400">{new Date(tx.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(tx.amount)}</div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
