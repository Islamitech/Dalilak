@echo off
setlocal
cd /d "%~dp0"
title Dalelak - Independent WhatsApp AI Agent & Radar (Port 3005)

echo ====================================================================
echo      Dalelak Platform - Standalone WhatsApp & Grok AI Agent
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
if not exist node_modules (
    echo [2] First time setup: Installing microservice dependencies...
    call npm install
)

:: 4. Start the standalone service
echo [3] Starting Independent WhatsApp AI Agent...
echo.
echo Dashboard URL: http://localhost:3005
echo ====================================================================
echo.

call npx tsx ../src/server/whatsapp-server.ts

if %errorlevel% neq 0 (
    echo.
    echo Standalone WhatsApp Agent process stopped with code %errorlevel%.
    pause
)
