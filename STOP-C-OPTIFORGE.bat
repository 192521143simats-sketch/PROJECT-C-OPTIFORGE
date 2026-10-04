@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [1/2] Stopping C-OptiForge application services...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Stop-Application.ps1" -ProjectRoot "%~dp0."
echo [2/2] Stopping C-OptiForge containers without deleting data...
docker info >nul 2>&1
if not errorlevel 1 docker compose -f "%~dp0compose.yaml" stop
echo C-OptiForge is stopped. The MySQL volume has been preserved.
exit /b 0
