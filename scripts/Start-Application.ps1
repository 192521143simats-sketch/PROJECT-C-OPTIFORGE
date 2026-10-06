param([Parameter(Mandatory=$true)][string]$ProjectRoot)
$ErrorActionPreference = 'Stop'
$runtimeDirectory = Join-Path $ProjectRoot '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

# A phone's localhost is the phone itself. Publish join links with this PC's
# active LAN address while keeping localhost available for desktop development.
$lanAddress = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
    Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } |
    ForEach-Object { $_.IPv4Address.IPAddress } |
    Where-Object { $_ -notmatch '^(127\.|169\.254\.)' } |
    Select-Object -First 1
if ($lanAddress) {
    $env:PUBLIC_BASE_URL = "http://${lanAddress}:5173"
    [IO.File]::WriteAllText((Join-Path $runtimeDirectory 'lan-url.txt'), $env:PUBLIC_BASE_URL)
    Write-Host "Mobile/LAN URL: $env:PUBLIC_BASE_URL"
}

function Test-Endpoint([string]$Uri) {
    try { Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 3 | Out-Null; return $true } catch { return $false }
}

$coordinatorReady = Test-Endpoint 'http://localhost:4100/health'
$webReady = Test-Endpoint 'http://localhost:5173/'
if ($coordinatorReady -and $webReady) {
    Write-Host 'GRID-X application services are already running; reusing them.'
    exit 0
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'node_modules'))) {
    Write-Host 'Installing Node.js dependencies (first start only)...'
    & npm.cmd install --no-audit --no-fund --prefix $ProjectRoot
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
}

if ($coordinatorReady -or $webReady) {
    throw 'Only part of GRID-X is already running. Run STOP-C-OPTIFORGE.bat, then start again.'
}

$stdout = Join-Path $runtimeDirectory 'application.log'
$stderr = Join-Path $runtimeDirectory 'application-error.log'
$process = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev') -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr
[IO.File]::WriteAllText((Join-Path $runtimeDirectory 'application.pid'), [string]$process.Id)

$deadline = [DateTime]::UtcNow.AddSeconds(90)
do {
    if ($process.HasExited) { throw "GRID-X exited during startup. See $stderr" }
    if ((Test-Endpoint 'http://localhost:4100/health') -and (Test-Endpoint 'http://localhost:5173/')) { exit 0 }
    Start-Sleep -Seconds 2
} while ([DateTime]::UtcNow -lt $deadline)
throw "GRID-X did not become ready within 90 seconds. See $stdout and $stderr"

