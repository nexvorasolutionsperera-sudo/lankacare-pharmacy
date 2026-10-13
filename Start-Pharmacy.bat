@echo off
setlocal
title LankaCare Pharmacy POS System

echo ============================================================
echo      LankaCare Pharmacy Management System
echo ============================================================
echo Starting Pharmacy server...
echo.

cd /d "%~dp0\server"

:: Start Node.js server in the background if not already running
start /b "" node server.js

:: Wait 1.5 seconds for the server to bind to port 5000
timeout /t 2 /nobreak >nul

:: Launch browser in dedicated "App Mode" (looks like a native Desktop App without URL bar)
set URL=http://localhost:5000

:: 1. Try Google Chrome in App Mode
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=%URL%
    goto :done
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=%URL%
    goto :done
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=%URL%
    goto :done
)

:: 2. Try Microsoft Edge in App Mode
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=%URL%
    goto :done
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=%URL%
    goto :done
)

:: 3. Fallback to default system browser
start "" %URL%

:done
exit
