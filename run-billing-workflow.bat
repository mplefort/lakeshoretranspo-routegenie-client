@echo off
setlocal enabledelayedexpansion

REM Lakeshore Transportation Billing Workflow Launcher for Windows
REM This batch file provides an easy way to run the billing workflow

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%"

echo [INFO] Lakeshore Transportation Billing Workflow Launcher

REM Check for help flag
for %%a in (%*) do (
    if "%%a"=="-h" goto :show_help
    if "%%a"=="--help" goto :show_help
)

REM Check if Node.js is installed
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or later.
    exit /b 1
)

for /f "tokens=1 delims=." %%i in ('node --version') do set "major_version=%%i"
set "major_version=!major_version:v=!"
if !major_version! lss 16 (
    echo [ERROR] Node.js version is too old. Please install Node.js 16 or later.
    exit /b 1
)

echo [SUCCESS] Node.js detected

REM Check if dependencies are installed
if not exist "%PROJECT_DIR%node_modules" (
    echo [WARNING] Dependencies not found. Installing...
    cd /d "%PROJECT_DIR%"
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install dependencies
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
)

REM Check if .env file exists
if not exist "%PROJECT_DIR%.env" (
    echo [WARNING] .env file not found. Creating from template...
    copy "%PROJECT_DIR%.env.example" "%PROJECT_DIR%.env" >nul
    echo [ERROR] Please edit .env file with your RouteGenie credentials before running the workflow.
    echo [INFO] Required variables: RG_CLIENT_ID, RG_CLIENT_SECRET
    exit /b 1
)

echo [INFO] Starting billing workflow...
cd /d "%PROJECT_DIR%"

REM Run the TypeScript version directly using global ts-node
call ts-node src/commands/billingWorkflowInteractive.ts %*
exit /b !errorlevel!

:show_help
echo Lakeshore Transportation Billing Workflow Launcher
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo   -s, --start-date ^<date^>      Start date (MM/DD/YYYY)
echo   -e, --end-date ^<date^>        End date (MM/DD/YYYY)
echo   -n, --invoice-number ^<num^>   Starting invoice number (default: 1000)
echo   -o, --output-dir ^<path^>      Output directory (default: ./reports/billing)
echo   -i, --interactive            Interactive mode
echo   -h, --help                   Show this help
echo.
echo Examples:
echo   %~nx0                                    # Use today's date, interactive mode
echo   %~nx0 -s 06/01/2025 -e 06/19/2025      # Specify date range
echo   %~nx0 --interactive                     # Force interactive mode
echo.
exit /b 0
