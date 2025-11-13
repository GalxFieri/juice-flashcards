@echo off
REM Juice Flashcards Web App - Local Server
REM This script starts a Python HTTP server so the app can load CSV files

echo.
echo ====================================================
echo   Juice Flashcards - Local Server Launcher
echo ====================================================
echo.

REM Get the directory where this batch file is located
setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
echo Current directory: !SCRIPT_DIR!
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo Checking for required files...
if not exist "!SCRIPT_DIR!index.html" (
    echo ERROR: index.html not found in !SCRIPT_DIR!
    echo.
    echo Please make sure this batch file is in the same folder as index.html
    echo.
    pause
    exit /b 1
)

if not exist "!SCRIPT_DIR!juice_cloze_import_UPDATED.csv" (
    echo ERROR: juice_cloze_import_UPDATED.csv not found in !SCRIPT_DIR!
    echo.
    echo Please make sure the CSV file is in the same folder as index.html
    echo.
    pause
    exit /b 1
)

echo ✓ All files found!
echo.
echo Starting local server...
echo.
echo The app will be available at: http://localhost:8000
echo.
echo To open the app in your browser:
echo - Copy and paste this address into your browser:
echo   http://localhost:8000
echo.
echo To stop the server: Press Ctrl+C in this window
echo.

REM Change to the script directory and start the server
cd /d "!SCRIPT_DIR!"
echo Server is running from: %cd%
echo.
echo Files in this directory:
dir /b *.html *.csv
echo.

REM Start the server (Python will serve from current directory)
python -m http.server 8000

REM If server exits, show message
echo.
echo Server stopped.
pause
