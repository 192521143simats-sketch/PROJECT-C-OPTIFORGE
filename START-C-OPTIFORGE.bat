@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo [1/6] Checking Docker...
docker info >nul 2>&1
if not errorlevel 1 goto DOCKER_ALREADY_READY
echo [2/6] Starting Docker Desktop...
set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not exist "!DOCKER_DESKTOP!" set "DOCKER_DESKTOP=%LocalAppData%\Docker\Docker Desktop.exe"
if not exist "!DOCKER_DESKTOP!" (
  echo ERROR: Docker Desktop was not found. Install Docker Desktop or start a compatible Docker Engine.
  exit /b 1
)
start "" "!DOCKER_DESKTOP!"
echo Waiting for Docker Engine to become ready...
set /a DOCKER_WAIT=0
:WAIT_DOCKER
ping 127.0.0.1 -n 3 >nul
docker info >nul 2>&1
if not errorlevel 1 goto DOCKER_READY
set /a DOCKER_WAIT+=2
if !DOCKER_WAIT! GEQ 180 (
  echo ERROR: Docker Engine did not become ready within 180 seconds.
  exit /b 1
)
goto WAIT_DOCKER

:DOCKER_ALREADY_READY
echo [2/6] Docker Engine is already ready.

:DOCKER_READY
echo [3/6] Preparing configuration and starting C-OptiForge containers...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Initialize-Environment.ps1" -ProjectRoot "%~dp0."
if errorlevel 1 exit /b 1
docker compose -f "%~dp0compose.yaml" up -d mysql
if errorlevel 1 (
  echo ERROR: Docker Compose could not start the C-OptiForge MySQL service.
  exit /b 1
)

echo [4/6] Waiting for MySQL to accept connections...
set /a MYSQL_WAIT=0
:WAIT_MYSQL
for /f "delims=" %%I in ('docker compose -f "%~dp0compose.yaml" ps -q mysql') do set "MYSQL_CONTAINER=%%I"
if defined MYSQL_CONTAINER (
  for /f "delims=" %%H in ('docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}" %MYSQL_CONTAINER% 2^>nul') do set "MYSQL_HEALTH=%%H"
  if /i "!MYSQL_HEALTH!"=="healthy" goto MYSQL_READY
)
ping 127.0.0.1 -n 3 >nul
set /a MYSQL_WAIT+=2
if !MYSQL_WAIT! GEQ 150 (
  echo ERROR: MySQL did not become healthy within 150 seconds.
  docker compose -f "%~dp0compose.yaml" logs --tail 40 mysql
  exit /b 1
)
goto WAIT_MYSQL

:MYSQL_READY
echo [5/6] Starting C-OptiForge coordinator and dashboard...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Start-Application.ps1" -ProjectRoot "%~dp0."
if errorlevel 1 (
  echo ERROR: C-OptiForge application startup failed. Check .runtime\application-error.log.
  exit /b 1
)

echo [6/6] Verifying services...
curl.exe --fail --silent http://localhost:4100/health >nul 2>&1
if errorlevel 1 (
  echo ERROR: Coordinator health check failed.
  exit /b 1
)
echo C-OptiForge is ready.
echo Dashboard: http://localhost:5173/admin
start "" "http://localhost:5173/admin"
exit /b 0

