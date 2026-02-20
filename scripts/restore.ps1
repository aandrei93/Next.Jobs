param(
  [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent),
  [string]$DbBackupPath,
  [string]$UploadsArchivePath = ""
)

if (-not $DbBackupPath) {
  Write-Error "Provide -DbBackupPath pointing to a backup .db file."
  exit 1
}

if (-not (Test-Path $DbBackupPath)) {
  Write-Error "Backup DB file not found: $DbBackupPath"
  exit 1
}

$dbPath = Join-Path $ProjectRoot "prisma\prisma\dev.db"
$dbDir = Split-Path $dbPath -Parent
$null = New-Item -ItemType Directory -Force -Path $dbDir

Copy-Item $DbBackupPath $dbPath -Force
Write-Host "Database restored to $dbPath"

if ($UploadsArchivePath) {
  if (-not (Test-Path $UploadsArchivePath)) {
    Write-Error "Uploads archive not found: $UploadsArchivePath"
    exit 1
  }

  $uploadsPath = Join-Path $ProjectRoot "public\uploads"
  $null = New-Item -ItemType Directory -Force -Path $uploadsPath
  Expand-Archive -Path $UploadsArchivePath -DestinationPath $uploadsPath -Force
  Write-Host "Uploads restored to $uploadsPath"
}

