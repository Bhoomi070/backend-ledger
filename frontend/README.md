# ⚡ Institutional Ledger Frontend (Next.js + TypeScript)
> Built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Lucide Icons.

---

## 🏗️ Architecture & Features

* **App Router (`src/app`)**: Next.js 15 App Router architecture with typed server/client boundaries.
* **Strict TypeScript Interfaces (`src/types/ledger.ts`)**: Full type coverage for `Account`, `LedgerEntry`, `Transaction`, `User`, and `ReconciliationReport`.
* **API Proxy Rewrites (`next.config.js`)**: Automatically proxies `/api/*` requests to the Express backend (`http://localhost:3000`), eliminating CORS and port-mismatch issues during development.
* **Reactive Double-Entry Transfer Stepper**: Interactive visual state machine animating the 6 execution stages (`BOLA Check` $\to$ `Idempotency` $\to$ `Snapshot Bal` $\to$ `Session Tx` $\to$ `Dual Entries` $\to$ `ACID Commit`).
* **Live Invariant Indicator**: Pulsing status badge that calculates continuous zero-drift reconciliation ($\Delta = \sum \text{Credits} - \sum \text{Debits} = 0.0000$).
* **Interview Simulation Bar**:
  * 🔁 **Test Duplicate Idempotency Key**: Demonstrates idempotent replay without double-debiting.
  * ⚠️ **Test Overdraft Guard**: Verifies balance guard and automatic session rollback.
* **Audit Statement Explorer**: Filterable chronological ledger view with Emerald (`+ CREDIT`) and Crimson (`- DEBIT`) badges.

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Next.js Development Server
```bash
npm run dev
```

### 3. Open in Browser
Open **`http://localhost:3001`** (Backend Express runs on `http://localhost:3000`).

---

## ⚙️ Environment Variables (Optional)

Create a `.env.local` inside `frontend/` if your backend is hosted on a different URL:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```
