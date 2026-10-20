Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Institutional Double-Entry Ledger Engine" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path ".env")) {
    Write-Host "[WARN] .env file not found, creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host "[INFO] Server starting at http://localhost:3000" -ForegroundColor Green
npm run dev
