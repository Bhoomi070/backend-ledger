@echo off
echo ========================================================
echo   Launching Next.js (TypeScript) Ledger Frontend
echo ========================================================
echo.

cd frontend

IF NOT EXIST node_modules (
    echo [INFO] Installing frontend dependencies (Next.js, TypeScript, Tailwind)...
    call npm install
)

echo [INFO] Starting Next.js development server on http://localhost:3001 ...
echo [INFO] Open your browser at http://localhost:3001
echo.
npm run dev
pause
