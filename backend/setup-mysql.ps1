# Shift White Gold - MySQL Setup Script
# Run this script to set up MySQL database

Write-Host "=== Shift White Gold - MySQL Setup ===" -ForegroundColor Green
Write-Host ""

# Check if MySQL is installed
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
try {
    $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
    if ($mysqlService) {
        Write-Host "✓ MySQL service found: $($mysqlService.DisplayName)" -ForegroundColor Green
    } else {
        Write-Host "✗ MySQL not found. Please install MySQL first." -ForegroundColor Red
        Write-Host "Download from: https://dev.mysql.com/downloads/installer/" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "✗ Could not check MySQL service" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Database Configuration ===" -ForegroundColor Green
$dbUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "root" }

$dbPass = Read-Host "Enter MySQL password" -AsSecureString
$dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

Write-Host ""
Write-Host "Creating database and tables..." -ForegroundColor Yellow

# Create database and run schema
$schemaPath = Join-Path $PSScriptRoot "schema.sql"
if (Test-Path $schemaPath) {
    try {
        $mysqlCmd = "mysql -u $dbUser -p$dbPassPlain -e `"source $schemaPath`""
        Invoke-Expression $mysqlCmd
        Write-Host "✓ Database schema created successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to create database schema" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "You can manually run the schema.sql file in MySQL Workbench" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ schema.sql not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Do you want to migrate data from data.json? (y/n)" -ForegroundColor Yellow
$migrate = Read-Host
if ($migrate -eq "y" -or $migrate -eq "Y") {
    Write-Host "Running migration..." -ForegroundColor Yellow
    npm run migrate
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/db.js with your MySQL credentials"
Write-Host "2. Or create backend/.env file (see .env.example)"
Write-Host "3. Run: npm start"
Write-Host ""
