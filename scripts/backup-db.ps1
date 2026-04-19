# Database Backup Script for Encryption App (PowerShell)
# Usage: .\backup-db.ps1 -BackupDir "C:\backups"

param (
    [string]$BackupDir = ".\backups"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "db_backup_$Timestamp.sql"

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "Starting database backup at $Timestamp..." -ForegroundColor Cyan

# Check if pg_dump is installed
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "Error: pg_dump could not be found. Please install PostgreSQL tools and add to PATH." -ForegroundColor Red
    exit 1
}

# Use environment variables
$DbHost = $env:DB_HOST
$DbPort = $env:DB_PORT
if (-not $DbPort) { $DbPort = "5432" }
$DbName = $env:DB_NAME
$DbUser = $env:DB_USER
$Password = $env:PGPASSWORD

if (-not $DbHost) {
    Write-Host "Error: DB_HOST environment variable is not set." -ForegroundColor Red
    exit 1
}

# Run pg_dump
& pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -F p --file=$BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful: $BackupFile" -ForegroundColor Green
    
    # Clean up backups older than 30 days
    $LimitDate = (Get-Date).AddDays(-30)
    Get-ChildItem -Path $BackupDir -Filter "db_backup_*.sql" | Where-Object { $_.CreationTime -lt $LimitDate } | Remove-Item
    Write-Host "Cleaned up old backups." -ForegroundColor Gray
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
    exit 1
}
