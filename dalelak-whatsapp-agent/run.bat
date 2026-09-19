@echo off
setlocal
cd /d "%~dp0"
title Dalelak - WhatsApp AI Gateway & Radar (Port 3005)

echo ====================================================================
echo      Dalelak Platform - Dedicated WhatsApp Gateway & AI Radar
echo ====================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR]: Node.js is not installed on this system!
    echo Please install Node.js (v18+) from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Free port 3005 if occupied
echo [1] Ensuring Port 3005 is available...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>nul
)

:: 3. Check / install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [2] Installing agent dependencies...
    call npm install
)

:: 4. Start the connected WhatsApp server from the core backend
echo [3] Starting WhatsApp Gateway with Live Project Linking...
echo.
echo Dashboard URL: http://localhost:3005
echo ====================================================================
echo.

cd /d "%~dp0.."
call npx tsx src/server/whatsapp-server.ts

if %errorlevel% neq 0 (
    echo.
    echo WhatsApp Gateway process stopped with code %errorlevel%.
    pause
)
