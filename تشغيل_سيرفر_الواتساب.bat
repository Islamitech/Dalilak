@echo off
setlocal
cd /d "%~dp0"
title Dalelak - Local WhatsApp Standalone Gateway (Port 3005)

echo ====================================================================
echo           Dalelak Platform - Standalone WhatsApp Gateway
echo ====================================================================
echo.

:: Try launching via PowerShell script (supports UTF-8, port auto-clean, rich output)
where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-whatsapp-server.ps1"
    if %errorlevel% equ 0 exit /b 0
)

:: Fallback if PowerShell is unavailable
echo [1] Checking Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR]: Node.js is not installed on this computer!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2] Freeing port 3005 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo [3] Checking dependencies...
if not exist node_modules (
    echo Installing required packages...
    call npm install
)

echo.
echo [4] Starting dedicated WhatsApp server on port 3005...
echo Server URL: http://localhost:3005
echo ====================================================================
echo.

call npx tsx src/server/whatsapp-server.ts

if %errorlevel% neq 0 (
    echo.
    echo Server process stopped with error code %errorlevel%.
    pause
)
