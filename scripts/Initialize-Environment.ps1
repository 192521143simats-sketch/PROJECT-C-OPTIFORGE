param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
$environmentPath = Join-Path $ProjectRoot '.env'
if (Test-Path -LiteralPath $environmentPath) {
    Write-Host 'Environment file already exists; preserving it.'
    exit 0
}

function New-RandomSecret {
    $bytes = New-Object byte[] 32
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}

$content = @"
HOST=0.0.0.0
PORT=4100
PUBLIC_BASE_URL=http://localhost:5173
COORDINATOR_PUBLIC_URL=http://localhost:4100
ADMIN_API_KEY=$(New-RandomSecret)
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=c_optiforge
DB_USER=c_optiforge
DB_PASSWORD=$(New-RandomSecret)
MYSQL_ROOT_PASSWORD=$(New-RandomSecret)
HEARTBEAT_STALE_MS=15000
HEARTBEAT_OFFLINE_MS=30000
TASK_TIMEOUT_MS=30000
"@
[IO.File]::WriteAllText($environmentPath, $content, [Text.UTF8Encoding]::new($false))
Write-Host 'Created .env with randomly generated local development credentials.'

