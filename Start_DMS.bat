@echo off
TITLE DMS Launcher
echo ======================================================
echo    Starting ISKCON Devotee Management System
echo ======================================================

cd /d "%~dp0"

:: Step 1: Start the application
:: npm run electron:dev starts Vite, Robot, and Electron concurrently
echo [*] Initializing system...
start /b cmd /c "npm run electron:dev"

:: Step 2: Wait for Vite (Frontend) to be ready
echo [*] Waiting for Frontend to initialize...
:wait_loop
timeout /t 2 >nul
netstat -ano | find "LISTENING" | find ":5173" >nul
if errorlevel 1 goto wait_loop

:: Step 3: Automatically open the WhatsApp QR Code page
echo [OK] Everything ready. Opening WhatsApp QR Code page...
start http://localhost:5173/#/settings

echo ======================================================
echo    DMS is running! 
echo    Scan the QR code in the browser window to connect.
echo ======================================================
timeout /t 5
exit
