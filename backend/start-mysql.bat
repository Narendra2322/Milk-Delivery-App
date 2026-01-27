@echo off
echo Starting MySQL Service...
net start MySQL80
if %errorlevel% == 0 (
    echo MySQL started successfully!
) else (
    echo Failed to start MySQL. Make sure you run this as Administrator.
)
pause
