param(
  [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent),
  [string]$OutDir = "",
  [switch]$IncludeUploads = $true
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $OutDir) {
  $OutDir = Join-Path $ProjectRoot "backups"
}

$null = New-Item -ItemType Directory -Force -Path $OutDir

$dbPath = Join-Path $ProjectRoot "prisma\prisma\dev.db"
if (-not (Test-Path $dbPath)) {
  Write-Error "Database file not found: $dbPath"
  exit 1
}

$dbBackup = Join-Path $OutDir "dev-$timestamp.db"
Copy-Item $dbPath $dbBackup -Force

$uploadsArchive = $null
if ($IncludeUploads) {
  $uploadsPath = Join-Path $ProjectRoot "public\uploads"
  if (Test-Path $uploadsPath) {
    $uploadsArchive = Join-Path $OutDir "uploads-$timestamp.zip"
    Compress-Archive -Path "$uploadsPath\*" -DestinationPath $uploadsArchive -Force
  }
}

Write-Host "Backup created:"
Write-Host "DB: $dbBackup"
if ($uploadsArchive) {
  Write-Host "Uploads: $uploadsArchive"
}

