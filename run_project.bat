@echo off
title JobNest Project Launcher
echo ========================================================
echo           STARTING JOBNEST RECRUITMENT PORTAL
echo ========================================================
echo.
echo [1/3] Starting Mock Database Server (port 3000)...
start "JobNest Backend (JSON Server)" cmd /k "npx.cmd -y json-server db.json --port 3000"

echo [2/3] Starting Frontend Web Server (port 5500)...
start "JobNest Frontend (Web Server)" cmd /k "npx.cmd -y serve . -p 5500"

echo [3/3] Launching Web Browser...
timeout /t 2 /nobreak >nul
start http://localhost:5500/views/index.html

echo.
echo ========================================================
echo JobNest is now live at: http://localhost:5500
echo Mock API is running at: http://localhost:3000
echo.
echo Do not close the two server windows while presenting!
echo ========================================================
pause
