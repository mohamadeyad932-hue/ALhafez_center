@echo off
title Start WEB_HAFAZE Project
echo ==============================================
echo        Starting WEB HAFAZE Project
echo ==============================================

:: Navigate to the directory where the script is located
cd /d "%~dp0"

:: Start Backend
echo Starting Backend...
start "Backend Server" cmd /k "cd backend && call ..\eya\Scripts\activate.bat && python -m uvicorn app.main:app --host localhost --port 8001"

:: Start Frontend
echo Starting Frontend...
start "Frontend Server" cmd /k "cd front && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo You can close this main window now.
pause
