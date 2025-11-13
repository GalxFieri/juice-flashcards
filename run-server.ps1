# Juice Flashcards Web App - Local Server
# This script starts a Python HTTP server so the app can load CSV files

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Juice Flashcards - Local Server Launcher" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Starting local server..." -ForegroundColor Green
Write-Host ""
Write-Host "The app will be available at: http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "To open the app in your browser:" -ForegroundColor Cyan
Write-Host "1. Copy and paste this address: http://localhost:8000" -ForegroundColor White
Write-Host "2. Or press Ctrl+Click on the address above" -ForegroundColor White
Write-Host ""
Write-Host "To stop the server: Press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Start the server
python -m http.server 8000
