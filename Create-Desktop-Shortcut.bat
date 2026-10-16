@echo off
setlocal
echo ============================================================
echo   Creating Desktop Shortcut for Aaush Pharmacy POS...
echo ============================================================
echo.

set SCRIPT_DIR=%~dp0
if "%SCRIPT_DIR:~-1%"=="\" set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$sc = $ws.CreateShortcut($desktop + '\Aaush Pharmacy.lnk'); " ^
  "$sc.TargetPath = 'wscript.exe'; " ^
  "$sc.Arguments = '\"" + '%SCRIPT_DIR%\Aaush-Pharmacy.vbs' + '\"'; " ^
  "$sc.WorkingDirectory = '%SCRIPT_DIR%'; " ^
  "$sc.Description = 'Aaush Pharmacy POS & Management System'; " ^
  "if (Test-Path '%SCRIPT_DIR%\aaush-icon.ico') { " ^
  "  $sc.IconLocation = '%SCRIPT_DIR%\aaush-icon.ico,0'; " ^
  "} else { " ^
  "  $sc.IconLocation = '%SystemRoot%\System32\shell32.dll,135'; " ^
  "} " ^
  "$sc.Save(); " ^
  "Write-Host 'Desktop Shortcut Created Successfully!' -ForegroundColor Green;"

echo.
echo ============================================================
echo   Success! Check your Windows Desktop for:
echo   "Aaush Pharmacy"
echo ============================================================
echo.
pause
