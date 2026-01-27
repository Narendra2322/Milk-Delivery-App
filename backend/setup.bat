@echo off
echo ================================================
echo   Shift White Gold - MySQL Database Setup
echo ================================================
echo.

echo [Step 1] Checking MySQL installation...
sc query MySQL 2>nul | find "RUNNING" >nul
if %errorlevel%==0 (
    echo [OK] MySQL is running
) else (
    echo [WARNING] MySQL service not found or not running
    echo Please install MySQL from: https://dev.mysql.com/downloads/installer/
    echo After installation, run this script again.
    pause
    exit
)

echo.
echo [Step 2] Enter your MySQL credentials
set /p DB_PASSWORD="Enter MySQL root password: "

echo.
echo [Step 3] Creating database and tables...
mysql -u root -p%DB_PASSWORD% < schema.sql 2>nul
if %errorlevel%==0 (
    echo [OK] Database created successfully!
) else (
    echo [ERROR] Failed to create database
    echo Make sure your password is correct
    pause
    exit
)

echo.
echo [Step 4] Do you want to migrate data from data.json? (y/n)
set /p MIGRATE="Migrate data? "
if /i "%MIGRATE%"=="y" (
    echo Running migration...
    node migrate.js
)

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo Update backend\db.js with your password:
echo   password: '%DB_PASSWORD%'
echo.
echo Then start the server:
echo   npm start
echo.
pause
