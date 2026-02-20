param(
  [string]$BaseUrl = $env:NEXT_PUBLIC_APP_URL,
  [string]$Secret = $env:HOUSEKEEPING_SECRET,
  [string]$TaskName = "NextJobs-Digest-Daily",
  [string]$DailyAt = "08:00"
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

$scriptPath = Join-Path $PSScriptRoot "digest.ps1"
if (-not (Test-Path $scriptPath)) {
  Write-Error "Missing script: $scriptPath"
  exit 1
}

try {
  $timeParts = $DailyAt.Split(":")
  if ($timeParts.Count -ne 2) {
    throw "Invalid time format"
  }
  $hour = [int]$timeParts[0]
  $minute = [int]$timeParts[1]
  if ($hour -lt 0 -or $hour -gt 23 -or $minute -lt 0 -or $minute -gt 59) {
    throw "Invalid time value"
  }
}
catch {
  Write-Error "DailyAt must be in HH:mm format (example: 08:00)."
  exit 1
}

$startTime = Get-Date -Hour $hour -Minute $minute -Second 0
if ($startTime -lt (Get-Date)) {
  $startTime = $startTime.AddDays(1)
}

$argList = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -BaseUrl `"$BaseUrl`" -Secret `"$Secret`""
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argList
$trigger = New-ScheduledTaskTrigger -Daily -At $startTime
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Scheduled task created/updated: $TaskName"
Write-Host "Runs daily at $DailyAt against $BaseUrl"
