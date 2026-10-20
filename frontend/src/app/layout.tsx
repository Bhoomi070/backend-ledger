import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { LedgerProvider } from '@/context/LedgerContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { FaucetModal } from '@/components/FaucetModal';
import { Toast } from '@/components/Toast';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'LEDGER // Institutional Double-Entry Core Platform',
  description: 'Enterprise double-entry ledger platform with distributed idempotency, immutable audit trails, and ACID session guarantees.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.variable} ${jetbrainsMono.variable} antialiased bg-[#f8fafc] dark:bg-[#070a12] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-200 selection:bg-indigo-500/20`}>
        <ThemeProvider>
          <LedgerProvider>
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
            <AuthModal />
            <FaucetModal />
            <Toast />
          </LedgerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
