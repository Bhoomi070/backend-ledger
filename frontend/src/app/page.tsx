'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ChevronRight,
  Plus,
  ArrowRight,
  Check,
  Shield,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useLedger } from '@/context/LedgerContext';
import { formatCurrency, apiRequest } from '@/lib/api';
import { Transaction } from '@/types/ledger';

export default function OverviewPage() {
  const {
    currentUser,
    accounts,
    reconciliation,
    setIsAuthModalOpen,
    setIsFaucetModalOpen,
    showToast,
  } = useLedger();

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  useEffect(() => {
    async function loadRecent() {
      try {
        setLoadingTransactions(true);
        const data = await apiRequest<{ transactions: Transaction[] }>('/transactions/recent');
        setRecentTransactions(data.transactions || []);
      } catch {
        // silent fail
      } finally {
        setLoadingTransactions(false);
      }
    }
    loadRecent();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {currentUser ? `Welcome, ${currentUser.name.split(' ')[0]}` : 'Financial Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time ledger trial balance and multi-account summary.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              if (!currentUser) return setIsAuthModalOpen(true);
              if (accounts.length === 0) return showToast('Create an account first in Accounts', 'warning');
              setIsFaucetModalOpen(true);
            }}
            className="text-xs font-medium px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
          >
            Fund Sandbox
          </button>
          <Link
            href="/transfers"
            className="text-xs font-medium px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 transition flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Move Money</span>
          </Link>
        </div>
      </div>

      {/* Primary Balance Metrics (Mercury / Stripe style) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Balance */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#111114] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Managed Balance</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Derived
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-semibold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatCurrency(totalBalance)}
            </div>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Across {accounts.length} active {accounts.length === 1 ? 'account' : 'accounts'}
          </div>
        </div>

        {/* Card 2: Invariant Reconciliation */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#111114] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ledger Balance Status</span>
            <Link
              href="/reconciliation"
              className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center"
            >
              <span>Audit details</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          <div className="my-3 flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                reconciliation?.isReconciled ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {reconciliation?.isReconciled ? 'Perfect Balance' : 'Imbalance Detected'}
            </span>
          </div>
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            Discrepancy: Δ = {reconciliation?.discrepancy.toFixed(4) || '0.0000'}
          </div>
        </div>

        {/* Card 3: System Volume */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#111114] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Processed Volume</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Double-Entry
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-semibold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatCurrency(reconciliation?.totalCredits || 0)}
            </div>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {reconciliation?.entryMetrics?.totalLedgerEntries || 0} immutable ledger entries
          </div>
        </div>
      </section>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Recent Transactions Activity (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Activity</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Latest committed transfers on the platform</p>
            </div>
            <Link
              href="/ledger"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium flex items-center space-x-1"
            >
              <span>View full ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] overflow-hidden shadow-sm">
            {loadingTransactions ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading activity...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400" />
                <p className="text-xs text-zinc-500">No transfers recorded yet.</p>
                <Link
                  href="/transfers"
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline mt-1"
                >
                  Initiate a transfer
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {recentTransactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx._id}
                    className="px-4 py-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                          {tx._id.slice(0, 8)}...
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(tx.amount)}
                      </div>
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Accounts & Technical Trace (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Accounts Card List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Accounts</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Source and settlement accounts</p>
              </div>
              <Link
                href="/accounts"
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium flex items-center space-x-1"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {accounts.length === 0 ? (
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center text-xs text-zinc-400">
                  No accounts provisioned yet.
                </div>
              ) : (
                accounts.slice(0, 3).map((acc) => (
                  <div
                    key={acc._id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-medium font-mono text-zinc-800 dark:text-zinc-200">
                          {acc._id.slice(0, 8)}...{acc._id.slice(-4)}
                        </span>
                        <button
                          onClick={() => handleCopy(acc._id)}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                          title="Copy account ID"
                        >
                          {copiedId === acc._id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {acc.currency} • Active
                      </span>
                    </div>

                    <div className="text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(acc.balance, acc.currency)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Understated Architecture Overview Card */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111114] flex flex-col gap-3 text-xs">
            <div className="flex items-center space-x-2 font-semibold text-zinc-900 dark:text-zinc-100">
              <Shield className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              <span>Core System Guarantees</span>
            </div>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-zinc-400">•</span>
                <span><strong>No direct mutation:</strong> Balances are derived dynamically from immutable ledger entries.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-zinc-400">•</span>
                <span><strong>Idempotency guard:</strong> Repeated requests with the same key safely return cached results.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-zinc-400">•</span>
                <span><strong>Zero-loss invariant:</strong> Total debits exactly match total credits across all transactions.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
