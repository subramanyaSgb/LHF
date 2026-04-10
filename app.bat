@echo off
title InfraSense - LHF Thermal Monitoring System
color 0A

:MENU
cls
echo.
echo  ============================================================
echo   INFRASENSE - LHF Thermal Monitoring System
echo   JSW Vijayanagar SMS
echo  ============================================================
echo.
echo   [1] Start Both (Backend + Frontend)
echo   [2] Start Backend Only
echo   [3] Start Frontend Only
echo   [4] Stop All Services
echo   [5] Check Status
echo   [6] Install Dependencies
echo   [7] Open in Browser
echo   [8] Open API Docs
echo   [9] Exit
echo.
set /p choice="  Select option: "

if "%choice%"=="1" goto START_BOTH
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_FRONTEND
if "%choice%"=="4" goto STOP_ALL
if "%choice%"=="5" goto STATUS
if "%choice%"=="6" goto INSTALL
if "%choice%"=="7" goto OPEN_BROWSER
if "%choice%"=="8" goto OPEN_DOCS
if "%choice%"=="9" goto EXIT
echo  Invalid option. Try again.
timeout /t 2 >nul
goto MENU

:START_BOTH
echo.
echo  Starting Backend (FastAPI on port 8000)...
cd /d "%~dp0backend"
start "InfraSense-Backend" cmd /k "title InfraSense Backend & color 0B & python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 3 >nul
echo  Starting Frontend (Vite on port 5173)...
cd /d "%~dp0frontend"
start "InfraSense-Frontend" cmd /k "title InfraSense Frontend & color 0D & npx vite --host"
timeout /t 2 >nul
echo.
echo  Both services started!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Login:    admin / admin123
echo.
pause
goto MENU

:START_BACKEND
echo.
echo  Starting Backend...
cd /d "%~dp0backend"
start "InfraSense-Backend" cmd /k "title InfraSense Backend & color 0B & python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo  Backend started on http://localhost:8000
echo.
pause
goto MENU

:START_FRONTEND
echo.
echo  Starting Frontend...
cd /d "%~dp0frontend"
start "InfraSense-Frontend" cmd /k "title InfraSense Frontend & color 0D & npx vite --host"
echo  Frontend started on http://localhost:5173
echo.
pause
goto MENU

:STOP_ALL
echo.
echo  Stopping all services...
taskkill /FI "WINDOWTITLE eq InfraSense Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq InfraSense Frontend*" /F >nul 2>&1
taskkill /F /IM "uvicorn.exe" >nul 2>&1
taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq InfraSense*" >nul 2>&1
echo  All services stopped.
echo.
pause
goto MENU

:STATUS
echo.
echo  Checking services...
echo.
curl -s http://localhost:8000/health >nul 2>&1
if %ERRORLEVEL%==0 (
    echo  [ONLINE]  Backend  - http://localhost:8000
) else (
    echo  [OFFLINE] Backend  - Not running
)
curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL%==0 (
    echo  [ONLINE]  Frontend - http://localhost:5173
) else (
    echo  [OFFLINE] Frontend - Not running
)
echo.
pause
goto MENU

:INSTALL
echo.
echo  Installing Backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt
echo.
echo  Installing Frontend dependencies...
cd /d "%~dp0frontend"
call npm install
echo.
echo  Dependencies installed!
echo.
pause
goto MENU

:OPEN_BROWSER
start http://localhost:5173
goto MENU

:OPEN_DOCS
start http://localhost:8000/docs
goto MENU

:EXIT
echo.
echo  Goodbye!
timeout /t 1 >nul
exit
