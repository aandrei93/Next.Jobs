param(
  [string]$BaseUrl = $env:NEXT_PUBLIC_APP_URL,
  [string]$Secret = $env:HOUSEKEEPING_SECRET
)

function Load-DotEnv {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line -split "=", 2
    if ($parts.Count -ne 2) {
      return
    }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    if ($key -and -not (Get-Item -Path "Env:$key" -ErrorAction SilentlyContinue)) {
      Set-Item -Path "Env:$key" -Value $value
    }
  }
}

$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
Load-DotEnv -Path $envPath

if (-not $BaseUrl) {
  $BaseUrl = $env:NEXT_PUBLIC_APP_URL
}

if (-not $Secret) {
  $Secret = $env:HOUSEKEEPING_SECRET
}

if (-not $BaseUrl) {
  $BaseUrl = "http://localhost:3000"
}

if (-not $Secret) {
  Write-Error "HOUSEKEEPING_SECRET is missing. Set it in .env or pass -Secret."
  exit 1
}

$uri = "$($BaseUrl.TrimEnd('/'))/api/internal/housekeeping"
$headers = @{ "x-housekeeping-secret" = $Secret }

try {
  $response = Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -TimeoutSec 60
  Write-Host "Housekeeping OK"
  $response | ConvertTo-Json -Depth 5
  exit 0
}
catch {
  Write-Error "Housekeeping failed: $($_.Exception.Message)"
  exit 1
}
