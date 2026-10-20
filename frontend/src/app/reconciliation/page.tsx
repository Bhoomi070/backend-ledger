'use client';

import React, { useState } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useLedger } from '@/context/LedgerContext';
import { formatCurrency } from '@/lib/api';

export default function ReconciliationPage() {
  const { reconciliation, refreshReconciliation, showToast } = useLedger();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleAudit = async () => {
    setRefreshing(true);
    await refreshReconciliation();
    await new Promise((r) => setTimeout(r, 300));
    setRefreshing(false);
    showToast('Reconciliation calculation updated', 'success');
  };

  const isBalanced = reconciliation?.isReconciled ?? true;
  const discrepancy = reconciliation?.discrepancy ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Reconciliation & Trial Balance
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Verification of system-wide double-entry equilibrium.
          </p>
        </div>

        <button
          onClick={handleAudit}
          disabled={refreshing}
          className="text-xs font-medium px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Calculating...' : 'Recalculate Balance'}</span>
        </button>
      </div>

      {/* Trial Balance Statement Card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] p-6 shadow-sm flex flex-col gap-6">
        
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Trial Balance Statement</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              As of {reconciliation?.verifiedAt ? new Date(reconciliation.verifiedAt).toLocaleString() : 'today'}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isBalanced ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className={isBalanced ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600'}>
              {isBalanced ? 'Balanced (Zero Drift)' : 'Discrepancy'}
            </span>
          </div>
        </div>

        {/* Accounting Ledger Row Breakdown */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
              <tr>
                <th className="py-2.5 px-4 font-medium">Account Category</th>
                <th className="py-2.5 px-4 font-medium text-right">Debit Balance</th>
                <th className="py-2.5 px-4 font-medium text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              <tr>
                <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">Total System Transactions</td>
                <td className="py-3 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(reconciliation?.totalDebits)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(reconciliation?.totalCredits)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100">
              <tr>
                <td className="py-3 px-4">Net Variance / Discrepancy</td>
                <td colSpan={2} className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                  Δ = {discrepancy.toFixed(4)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Explanation Footer */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed space-y-2">
          <p>
            In institutional double-entry bookkeeping, the accounting equation dictates that every credit must be balanced by an equivalent debit. A zero discrepancy confirms that no orphaned funds or rounding leaks exist in the system.
          </p>
        </div>
      </div>

      {/* System Audit Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex flex-col gap-1">
          <span className="text-zinc-400 font-mono text-[11px]">Total Executed Transactions</span>
          <span className="text-xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
            {reconciliation?.totalTransactions || 0}
          </span>
          <span className="text-zinc-500 text-[11px]">Validated with session isolation</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex flex-col gap-1">
          <span className="text-zinc-400 font-mono text-[11px]">Total Immutable Ledger Entries</span>
          <span className="text-xl font-semibold font-mono text-zinc-900 dark:text-zinc-100">
            {reconciliation?.entryMetrics.totalLedgerEntries || 0}
          </span>
          <span className="text-zinc-500 text-[11px]">Equal pairs of debits and credits</span>
        </div>
      </div>

    </div>
  );
}
