Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching Next.js (TypeScript) Ledger Frontend" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies (Next.js, TypeScript, Tailwind)..." -ForegroundColor Yellow
    npm install
}

Write-Host "[INFO] Starting Next.js development server on http://localhost:3001" -ForegroundColor Green
npm run dev
