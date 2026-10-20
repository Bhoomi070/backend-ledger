'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  Coins,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useLedger } from '@/context/LedgerContext';
import { formatCurrency, apiRequest } from '@/lib/api';
import { Account } from '@/types/ledger';

export default function AccountsPage() {
  const {
    currentUser,
    accounts,
    refreshAccounts,
    setIsAuthModalOpen,
    setIsFaucetModalOpen,
    showToast,
  } = useLedger();

  const [currency, setCurrency] = useState<string>('INR');
  const [creating, setCreating] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast('Copied account ID', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return setIsAuthModalOpen(true);
    setCreating(true);
    try {
      await apiRequest<{ account: Account }>('/accounts', {
        method: 'POST',
        body: JSON.stringify({ currency }),
      });
      showToast(`Created new ${currency} account`, 'success');
      setShowCreateForm(false);
      await refreshAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create account';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Accounts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage your ledger accounts and settlement balances.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              if (!currentUser) return setIsAuthModalOpen(true);
              setIsFaucetModalOpen(true);
            }}
            className="text-xs font-medium px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center space-x-1.5"
          >
            <Coins className="w-3.5 h-3.5 text-zinc-500" />
            <span>Fund Sandbox</span>
          </button>
          <button
            onClick={() => {
              if (!currentUser) return setIsAuthModalOpen(true);
              setShowCreateForm(!showCreateForm);
            }}
            className="text-xs font-medium px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 transition flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Inline Account Creation Drawer */}
      {showCreateForm && (
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Provision a New Account</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Account Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-4 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114]">
            <p className="text-xs text-zinc-500">No accounts provisioned yet.</p>
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc._id}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex flex-col justify-between gap-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {acc.currency}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {acc.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center space-x-1.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  <span>{acc._id.slice(0, 10)}...{acc._id.slice(-6)}</span>
                  <button
                    onClick={() => handleCopy(acc._id)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                    title="Copy full ID"
                  >
                    {copiedId === acc._id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <div className="text-2xl font-semibold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 mt-2">
                  {formatCurrency(acc.balance, acc.currency)}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {new Date(acc.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/ledger?accountId=${acc._id}`}
                  className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium flex items-center space-x-1"
                >
                  <span>View ledger</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
