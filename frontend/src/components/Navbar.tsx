'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Plus,
  Coins,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLedger } from '@/context/LedgerContext';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/transfers', label: 'Move Money' },
  { href: '/ledger', label: 'Ledger' },
  { href: '/reconciliation', label: 'Reconciliation' },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const {
    currentUser,
    logout,
    reconciliation,
    setIsAuthModalOpen,
    setIsFaucetModalOpen,
    accounts,
    showToast,
  } = useLedger();

  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Brand & Desktop Links */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm">
              L
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                Ledger
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Sandbox
              </span>
            </div>
          </Link>

          {/* Clean Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          
          {/* Subtle Ledger Invariant Status Pill */}
          <Link
            href="/reconciliation"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
            title="Double-entry balance status"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                reconciliation?.isReconciled ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>
              {reconciliation?.isReconciled
                ? 'Balanced'
                : `Δ ${reconciliation?.discrepancy.toFixed(2) || '0.00'}`}
            </span>
          </Link>

          {/* Quick Faucet Deposit */}
          <button
            onClick={() => {
              if (!currentUser) return setIsAuthModalOpen(true);
              if (accounts.length === 0) return showToast('Create an account first in Accounts', 'warning');
              setIsFaucetModalOpen(true);
            }}
            className="hidden sm:flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition border border-zinc-200 dark:border-zinc-700"
          >
            <Coins className="w-3.5 h-3.5 text-zinc-500" />
            <span>Fund Sandbox</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-zinc-400 hover:text-zinc-100" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 hover:text-zinc-900" />
            )}
          </button>

          {/* User Profile or Sign In */}
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div
                className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-medium"
                title={currentUser.email}
              >
                {getInitials(currentUser.name)}
              </div>
              <button
                onClick={logout}
                className="text-xs text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 transition"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-md text-zinc-600 dark:text-zinc-400"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] px-4 py-3 flex flex-col space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-xs font-medium ${
                  active
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
