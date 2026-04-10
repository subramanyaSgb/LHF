@echo off
setlocal enabledelayedexpansion
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
set "choice="
set /p "choice=  Select option: "

if "!choice!"=="1" goto START_BOTH
if "!choice!"=="2" goto START_BACKEND
if "!choice!"=="3" goto START_FRONTEND
if "!choice!"=="4" goto STOP_ALL
if "!choice!"=="5" goto STATUS
if "!choice!"=="6" goto INSTALL
if "!choice!"=="7" goto OPEN_BROWSER
if "!choice!"=="8" goto OPEN_DOCS
if "!choice!"=="9" goto EXIT
echo.
echo  Invalid option. Try again.
timeout /t 2 >nul
goto MENU

:START_BOTH
call :STOP_SERVICES_SILENT
echo.
echo  Starting Backend (FastAPI on port 8000)...
cd /d "%~dp0backend"
if not exist ".env" (
    echo  Creating .env from .env.example...
    copy /y ".env.example" ".env" >nul 2>&1
)
start "InfraSense-Backend" cmd /k "title InfraSense Backend && color 0B && cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo  Waiting for backend to start...
timeout /t 4 >nul

REM Verify backend started
curl -s http://localhost:8000/health >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo  [WARNING] Backend may not have started yet. Check the backend window for errors.
) else (
    echo  [OK] Backend is running.
)

echo.
echo  Starting Frontend (Vite on port 5173)...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo  node_modules not found. Running npm install first...
    call npm install
)
start "InfraSense-Frontend" cmd /k "title InfraSense Frontend && color 0D && cd /d "%~dp0frontend" && npx vite --host"
timeout /t 3 >nul
echo  [OK] Frontend starting.
echo.
echo  ============================================================
echo   Both services started!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo   NOTE: Admin password is generated randomly on first boot.
echo         Check the Backend window for the password.
echo  ============================================================
echo.
pause
goto MENU

:START_BACKEND
call :STOP_BACKEND_SILENT
echo.
echo  Starting Backend...
cd /d "%~dp0backend"
if not exist ".env" (
    echo  Creating .env from .env.example...
    copy /y ".env.example" ".env" >nul 2>&1
)
start "InfraSense-Backend" cmd /k "title InfraSense Backend && color 0B && cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 4 >nul
curl -s http://localhost:8000/health >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo  [WARNING] Backend may not have started. Check the backend window.
) else (
    echo  [OK] Backend started on http://localhost:8000
)
echo.
pause
goto MENU

:START_FRONTEND
call :STOP_FRONTEND_SILENT
echo.
echo  Starting Frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo  node_modules not found. Running npm install first...
    call npm install
)
start "InfraSense-Frontend" cmd /k "title InfraSense Frontend && color 0D && cd /d "%~dp0frontend" && npx vite --host"
timeout /t 3 >nul
echo  [OK] Frontend starting on http://localhost:5173
echo.
pause
goto MENU

:STOP_ALL
echo.
echo  Stopping all services...
echo.
echo  Killing processes on port 8000 (Backend)...
call :KILL_PORT_VERBOSE 8000
echo  Killing processes on port 5173 (Frontend)...
call :KILL_PORT_VERBOSE 5173
taskkill /FI "WINDOWTITLE eq InfraSense Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq InfraSense Frontend*" /F >nul 2>&1
timeout /t 2 >nul
echo.
REM Verify everything is dead
set "_still_running=0"
netstat -ano 2>nul | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if !ERRORLEVEL!==0 set "_still_running=1"
netstat -ano 2>nul | findstr ":5173 " | findstr "LISTENING" >nul 2>&1
if !ERRORLEVEL!==0 set "_still_running=1"
if !_still_running!==1 (
    echo  [WARNING] Some processes may still be running. Try again or close manually.
) else (
    echo  [OK] All services stopped. Ports 8000 and 5173 are free.
)
echo.
pause
goto MENU

:STOP_SERVICES_SILENT
call :KILL_PORT 8000
call :KILL_PORT 5173
REM Also try by window title as backup
taskkill /FI "WINDOWTITLE eq InfraSense Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq InfraSense Frontend*" /F >nul 2>&1
exit /b

:STOP_BACKEND_SILENT
call :KILL_PORT 8000
taskkill /FI "WINDOWTITLE eq InfraSense Backend*" /F >nul 2>&1
exit /b

:STOP_FRONTEND_SILENT
call :KILL_PORT 5173
taskkill /FI "WINDOWTITLE eq InfraSense Frontend*" /F >nul 2>&1
exit /b

:KILL_PORT_VERBOSE
REM Same as KILL_PORT but prints what it kills
set "_port=%~1"
set "_found=0"
for /f "usebackq tokens=*" %%L in (`netstat -ano ^| findstr ":%_port% " ^| findstr "LISTENING"`) do (
    set "_line=%%L"
    set "_found=1"
    call :EXTRACT_AND_KILL_VERBOSE
)
if !_found!==0 echo    No process found on port %_port%.
exit /b

:EXTRACT_AND_KILL_VERBOSE
for %%P in (!_line!) do set "_pid=%%P"
if defined _pid (
    if "!_pid!" NEQ "0" (
        echo    Killing PID !_pid! on port %_port%...
        taskkill /PID !_pid! /T /F >nul 2>&1
    )
)
exit /b

:KILL_PORT
REM Kill ALL processes listening on a given port (including child processes)
REM Usage: call :KILL_PORT 8000
set "_port=%~1"
for /f "usebackq tokens=*" %%L in (`netstat -ano ^| findstr ":%_port% " ^| findstr "LISTENING"`) do (
    set "_line=%%L"
    call :EXTRACT_AND_KILL
)
exit /b

:EXTRACT_AND_KILL
REM Extract PID from the end of the netstat line and kill the process tree
for %%P in (!_line!) do set "_pid=%%P"
if defined _pid (
    if "!_pid!" NEQ "0" (
        taskkill /PID !_pid! /T /F >nul 2>&1
    )
)
exit /b

:STATUS
echo.
echo  Checking services...
echo.
curl -s http://localhost:8000/health >nul 2>&1
if !ERRORLEVEL!==0 (
    echo  [ONLINE]  Backend  - http://localhost:8000
    REM Show route count
    for /f %%i in ('curl -s http://localhost:8000/health 2^>nul') do echo            %%i
) else (
    echo  [OFFLINE] Backend  - Not running
)
echo.
curl -s -o nul -w "%%{http_code}" http://localhost:5173 >nul 2>&1
if !ERRORLEVEL!==0 (
    echo  [ONLINE]  Frontend - http://localhost:5173
) else (
    echo  [OFFLINE] Frontend - Not running
)
echo.

REM Check if ports are in use by something else
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING" 2^>nul') do (
    echo  Port 8000 in use by PID: %%a
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    echo  Port 5173 in use by PID: %%a
)
echo.
pause
goto MENU

:INSTALL
echo.
echo  ============================================================
echo   Installing Dependencies
echo  ============================================================
echo.

echo  [1/3] Checking Python...
python --version 2>nul
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Python not found! Install Python 3.11+ first.
    pause
    goto MENU
)

echo.
echo  [2/3] Installing Backend dependencies...
cd /d "%~dp0backend"
if not exist ".env" (
    echo  Creating .env from .env.example...
    copy /y ".env.example" ".env" >nul 2>&1
)
pip install -r requirements.txt
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Backend dependency install failed!
    pause
    goto MENU
)
echo  [OK] Backend dependencies installed.

echo.
echo  [3/3] Installing Frontend dependencies...
cd /d "%~dp0frontend"

REM Check Node.js
node --version 2>nul
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Node.js not found! Install Node.js 18+ first.
    pause
    goto MENU
)

call npm install
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Frontend dependency install failed!
    pause
    goto MENU
)
echo  [OK] Frontend dependencies installed.

echo.
echo  ============================================================
echo   All dependencies installed successfully!
echo  ============================================================
echo.
pause
goto MENU

:OPEN_BROWSER
echo  Opening frontend...
start "" http://localhost:5173
timeout /t 1 >nul
goto MENU

:OPEN_DOCS
echo  Opening API docs...
start "" http://localhost:8000/docs
timeout /t 1 >nul
goto MENU

:EXIT
echo.
echo  Goodbye!
timeout /t 1 >nul
endlocal
exit /b
