@echo off
SETLOCAL EnableDelayedExpansion
TITLE ISKCON DMS Setup Wizard
COLOR 0A

:: Define paths
set "ROOT_DIR=%~dp0"
set "BOT_DIR=%ROOT_DIR%whatsapp-bot\"
set "ENV_FILE=%ROOT_DIR%.env"
set "ENV_EXAMPLE=%ROOT_DIR%.env.example"
set "BOT_ENV_FILE=%BOT_DIR%.env"
set "BOT_ENV_EXAMPLE=%BOT_DIR%.env.example"

echo =====================================================================
echo                 ISKCON Devotee Management System
echo                       Setup and Installer
echo =====================================================================
echo.

:: 1. Check prerequisites
echo [*] Checking System Prerequisites...

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in system PATH.
    echo Please install Node.js (v18 or higher) from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   - Node.js version: %NODE_VER% (OK)

:: Check NPM
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in system PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo   - npm version:  %NPM_VER% (OK)
echo.

:: 2. Setup Environment Variables
echo [*] Configuring Environment Files (.env)...
if not exist "%ENV_FILE%" (
    if exist "%ENV_EXAMPLE%" (
        copy "%ENV_EXAMPLE%" "%ENV_FILE%" >nul
        echo   - Created root .env from template.
    ) else (
        echo   - Warning: .env.example not found. Creating basic root .env.
        (
            echo GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json
            echo GOOGLE_SHEETS_SHARE_EMAIL=info.iskcondrugapur@gmail.com
        ) > "%ENV_FILE%"
    )
) else (
    echo   - Root .env file already exists. (Skipped)
)

if not exist "%BOT_ENV_FILE%" (
    if exist "%BOT_ENV_EXAMPLE%" (
        copy "%BOT_ENV_EXAMPLE%" "%BOT_ENV_FILE%" >nul
        echo   - Created whatsapp-bot .env from template.
    ) else (
        echo   - Warning: whatsapp-bot/.env.example not found. Creating basic .env.
        (
            echo CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
            echo CLOUDINARY_API_KEY=your_cloudinary_api_key
            echo CLOUDINARY_API_SECRET=your_cloudinary_api_secret
            echo GOOGLE_CLIENT_ID=your_google_client_id
            echo GOOGLE_CLIENT_SECRET=your_google_client_secret
            echo GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
        ) > "%BOT_ENV_FILE%"
    )
) else (
    echo   - whatsapp-bot/.env file already exists. (Skipped)
)
echo.

:: Menu options
:menu
echo =====================================================================
echo  Please select an action:
echo =====================================================================
echo  [1] Install/Update Dependencies (Frontend and Whatsapp Bot)
echo  [2] Run Dev Environment (Vite + Electron + Whatsapp Bot)
echo  [3] Build Production Setup Installer (.exe)
echo  [4] Diagnostics (Validate Database and Credentials)
echo  [5] Exit
echo =====================================================================
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto install_deps
if "%choice%"=="2" goto run_dev
if "%choice%"=="3" goto build_installer
if "%choice%"=="4" goto run_diagnostics
if "%choice%"=="5" goto end
goto menu

:install_deps
echo.
echo [*] Installing Frontend Dependencies...
cd /d "%ROOT_DIR%"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Frontend installation completed with warnings/errors.
) else (
    echo [OK] Frontend dependencies installed successfully.
)

echo.
echo [*] Installing Whatsapp Bot Dependencies...
cd /d "%BOT_DIR%"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Whatsapp Bot installation completed with warnings/errors.
) else (
    echo [OK] Whatsapp Bot dependencies installed successfully.
)
cd /d "%ROOT_DIR%"
echo.
echo [SUCCESS] Dependencies installation process complete!
echo.
pause
goto menu

:run_dev
echo.
echo [*] Launching Application in Dev Mode...
cd /d "%ROOT_DIR%"
if exist Start_DMS.bat (
    call Start_DMS.bat
) else (
    call npm run electron:dev
)
goto end

:build_installer
echo.
echo [*] Compiling Application and Building Installer (.exe)...
cd /d "%ROOT_DIR%"
call npm run electron:build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build failed! Check the error logs for details.
    echo Common fix: If you get permission errors on 7za.exe, make sure
    echo you have configured the 7zip workaround correctly.
) else (
    echo.
    echo [SUCCESS] Build completed successfully!
    echo Setup file has been created at:
    echo %ROOT_DIR%release\Devotee Management Setup 0.0.0.exe
)
echo.
pause
goto menu

:run_diagnostics
echo.
echo [*] Running Diagnostics...
cd /d "%ROOT_DIR%"

:: Check database
echo  - Checking SQLite Database...
if exist "%BOT_DIR%devotee_mgmt.db" (
    echo    [OK] SQLite Database exists at: %BOT_DIR%devotee_mgmt.db
    if exist "node_modules\sqlite3" (
        node check_db.mjs
    ) else (
        echo    [INFO] Install dependencies (Option 1) to query database tables.
    )
) else (
    echo    [WARNING] Database not found at: %BOT_DIR%devotee_mgmt.db
    echo    It will be automatically created on first bot run.
)

:: Check Google Credentials
echo  - Checking Google Credentials...
if exist "%ROOT_DIR%google-credentials.json" (
    echo    [OK] google-credentials.json found.
) else (
    echo    [WARNING] google-credentials.json NOT found.
    echo    Please place your Google service account credentials JSON in:
    echo    %ROOT_DIR%google-credentials.json
)

if exist "%ROOT_DIR%whatsapp-bot\initial_admin_password.txt" (
    echo    [INFO] Initial admin password saved at whatsapp-bot\initial_admin_password.txt
)

echo.
pause
goto menu

:end
echo.
echo Thank you for using ISKCON Devotee Management System Setup Wizard!
echo.
ENDLOCAL
pause
