@echo off
setlocal
echo ============================================================
echo   Backing up LankaCare Pharmacy Database...
echo ============================================================

set DB_PATH=%~dp0server\pharmacy.db
set BACKUP_DIR=%~dp0backups

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

copy "%DB_PATH%" "%BACKUP_DIR%\pharmacy_backup_%TIMESTAMP%.db" >nul

if %errorlevel% equ 0 (
    echo.
    echo Backup created successfully:
    echo %BACKUP_DIR%\pharmacy_backup_%TIMESTAMP%.db
) else (
    echo.
    echo Backup failed! Please ensure the server folder exists.
)

echo ============================================================
pause
