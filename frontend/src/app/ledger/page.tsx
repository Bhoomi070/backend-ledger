'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RotateCw,
  Copy,
  Check,
  Download,
  Search,
} from 'lucide-react';
import { useLedger } from '@/context/LedgerContext';
import { apiRequest, formatCurrency } from '@/lib/api';
import { StatementResponse } from '@/types/ledger';

function LedgerContent() {
  const searchParams = useSearchParams();
  const queryAccId = searchParams.get('accountId');

  const { accounts, showToast } = useLedger();

  const [selectedAccId, setSelectedAccId] = useState<string>(queryAccId || accounts[0]?._id || '');
  const [statement, setStatement] = useState<StatementResponse | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (queryAccId) {
      setSelectedAccId(queryAccId);
    } else if (accounts.length > 0 && !selectedAccId) {
      setSelectedAccId(accounts[0]._id);
    }
  }, [queryAccId, accounts, selectedAccId]);

  const loadStatement = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await apiRequest<StatementResponse>(`/accounts/${id}/statement`);
      setStatement(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load statement';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedAccId) {
      loadStatement(selectedAccId);
    }
  }, [selectedAccId, loadStatement]);

  const handleCopy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopiedId(t);
    showToast('Copied ID', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (!statement || statement.entries.length === 0) {
      return showToast('No entries to export', 'warning');
    }

    const headers = ['Entry ID,Timestamp,Type,Amount,Transaction ID\n'];
    const rows = statement.entries.map((e) => {
      const txId = typeof e.transaction === 'object' ? e.transaction?._id : e.transaction;
      return `${e._id},"${new Date(e.createdAt).toISOString()}",${e.type},${e.amount},${txId}\n`;
    });

    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_${selectedAccId.slice(0, 8)}.csv`;
    a.click();
    showToast('Exported CSV file', 'success');
  };

  const filteredEntries = (statement?.entries || []).filter((entry) => {
    const matchesFilter = filterType === 'ALL' || entry.type === filterType;
    const txId = typeof entry.transaction === 'object' ? entry.transaction?._id : entry.transaction;
    const matchesSearch =
      !searchTerm ||
      entry._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(txId).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Ledger Activity
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Immutable chronological audit log for double-entry records.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Account Selector & Summary */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Account:</label>
          <select
            value={selectedAccId}
            onChange={(e) => setSelectedAccId(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
          >
            <option value="">Select Account...</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc._id.slice(0, 10)}... ({formatCurrency(acc.balance, acc.currency)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-6 text-xs">
          <div>
            <span className="text-zinc-400">Balance: </span>
            <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              {formatCurrency(statement?.account.currentBalance, statement?.account.currency)}
            </span>
          </div>
          <div>
            <span className="text-zinc-400">Entries: </span>
            <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">
              {statement?.entriesCount || 0}
            </span>
          </div>
          <button
            onClick={() => selectedAccId && loadStatement(selectedAccId)}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1"
            title="Refresh statement"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1">
          {(['ALL', 'CREDIT', 'DEBIT'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                filterType === t
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'CREDIT' ? 'Credits' : 'Debits'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by ID..."
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Clean Table (Stripe/Linear style) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 font-mono text-zinc-500 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium">Reference ID</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    Loading entries...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isCredit = entry.type === 'CREDIT';
                  const txId = typeof entry.transaction === 'object' ? entry.transaction?._id : entry.transaction;

                  return (
                    <tr key={entry._id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4 text-zinc-500">
                        {new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            isCredit
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {isCredit ? `+` : `-`}
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        <span>{txId ? String(txId).slice(0, 14) : 'N/A'}...</span>
                        {txId && (
                          <button
                            onClick={() => handleCopy(String(txId))}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-1.5"
                          >
                            {copiedId === String(txId) ? (
                              <Check className="w-3 h-3 text-emerald-500 inline" />
                            ) : (
                              <Copy className="w-3 h-3 inline" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[10px]">
                        Immutable
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading ledger...</div>}>
      <LedgerContent />
    </Suspense>
  );
}
