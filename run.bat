@echo off
echo ========================================================
echo   Starting Institutional Double-Entry Ledger Engine
echo ========================================================
echo.

IF NOT EXIST node_modules (
    echo [INFO] Installing NPM dependencies...
    call npm install
)

IF NOT EXIST .env (
    echo [WARN] .env file not found, creating from .env.example...
    copy .env.example .env
)

echo [INFO] Launching server on http://localhost:3000 ...
echo [INFO] Open your browser and navigate to http://localhost:3000
echo.
npm run dev
pause
