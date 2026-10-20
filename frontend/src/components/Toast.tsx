'use client';

import React from 'react';
import { useLedger } from '@/context/LedgerContext';
import { Check, AlertCircle, Info } from 'lucide-react';

export function Toast() {
  const { toast } = useLedger();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 px-4 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 text-xs font-medium pointer-events-auto transition-all">
        {toast.type === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600 flex-shrink-0" />}
        {toast.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600 flex-shrink-0" />}
        {toast.type === 'info' && <Info className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
