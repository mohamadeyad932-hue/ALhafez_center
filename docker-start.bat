@echo off
chcp 65001 >nul
title ALhafez Center - Docker Manager
color 0A

echo ╔══════════════════════════════════════════════════╗
echo ║       صالة الحافظ للقطع الكهربائية - Docker      ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: Navigate to the directory where the script is located
cd /d "%~dp0"

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running! Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

:: Check if .env file exists, if not copy from template
if not exist ".env" (
    echo [INFO] Creating .env from .env.docker template...
    copy ".env.docker" ".env" >nul
    echo [INFO] .env file created. Please edit it with your API keys.
    echo.
)

echo Choose an option:
echo.
echo   [1] Start Production    (docker compose up -d --build)
echo   [2] Start Development   (docker compose -f docker-compose.dev.yml up -d --build)
echo   [3] Stop All            (docker compose down)
echo   [4] View Logs           (docker compose logs -f)
echo   [5] Rebuild Backend     (docker compose up -d --build backend)
echo   [6] Rebuild Frontend    (docker compose up -d --build frontend)
echo   [7] Database Backup     (pg_dump)
echo   [8] Clean Everything    (docker compose down -v --rmi all)
echo   [0] Exit
echo.

set /p choice="Enter your choice (0-8): "

if "%choice%"=="1" (
    echo.
    echo [INFO] Starting production environment...
    docker compose up -d --build
    echo.
    echo [SUCCESS] All services are starting!
    echo   - Frontend:  http://localhost  (via Nginx)
    echo   - Backend:   http://localhost/api
    echo   - API Docs:  http://localhost:8001/docs
    echo   - Direct FE: http://localhost:3000
    echo.
)

if "%choice%"=="2" (
    echo.
    echo [INFO] Starting development environment with hot-reload...
    docker compose -f docker-compose.dev.yml up -d --build
    echo.
    echo [SUCCESS] Dev environment is starting!
    echo   - Frontend:  http://localhost:3000
    echo   - Backend:   http://localhost:8001
    echo   - API Docs:  http://localhost:8001/docs
    echo.
)

if "%choice%"=="3" (
    echo.
    echo [INFO] Stopping all containers...
    docker compose down
    docker compose -f docker-compose.dev.yml down 2>nul
    echo [SUCCESS] All containers stopped.
    echo.
)

if "%choice%"=="4" (
    echo.
    echo [INFO] Showing logs (Ctrl+C to exit)...
    docker compose logs -f
)

if "%choice%"=="5" (
    echo.
    echo [INFO] Rebuilding backend...
    docker compose up -d --build backend
    echo [SUCCESS] Backend rebuilt and restarted.
    echo.
)

if "%choice%"=="6" (
    echo.
    echo [INFO] Rebuilding frontend...
    docker compose up -d --build frontend
    echo [SUCCESS] Frontend rebuilt and restarted.
    echo.
)

if "%choice%"=="7" (
    echo.
    echo [INFO] Creating database backup...
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a%%b
    set BACKUP_FILE=backup_%mydate%_%mytime%.sql
    docker compose exec db pg_dump -U hafaz_user alhafaz_center > %BACKUP_FILE%
    echo [SUCCESS] Backup saved to: %BACKUP_FILE%
    echo.
)

if "%choice%"=="8" (
    echo.
    echo [WARNING] This will delete ALL containers, volumes, and images!
    set /p confirm="Are you sure? (y/N): "
    if /i "%confirm%"=="y" (
        docker compose down -v --rmi all
        docker compose -f docker-compose.dev.yml down -v --rmi all 2>nul
        echo [SUCCESS] Everything cleaned up.
    ) else (
        echo [INFO] Cancelled.
    )
    echo.
)

if "%choice%"=="0" (
    exit /b 0
)

pause
