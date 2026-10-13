@echo off
setlocal
echo ============================================================
echo   Creating Desktop Shortcut for LankaCare Pharmacy POS...
echo ============================================================

set SCRIPT_DIR=%~dp0
:: Remove trailing backslash if present
if "%SCRIPT_DIR:~-1%"=="\" set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$sc = $ws.CreateShortcut($desktop + '\LankaCare Pharmacy POS.lnk'); " ^
  "$sc.TargetPath = 'wscript.exe'; " ^
  "$sc.Arguments = '\"" + '%SCRIPT_DIR%\LankaCare-Pharmacy-Silent.vbs' + '\"'; " ^
  "$sc.WorkingDirectory = '%SCRIPT_DIR%'; " ^
  "$sc.Description = 'LankaCare Pharmacy POS & Management System'; " ^
  "$sc.IconLocation = '%SystemRoot%\System32\shell32.dll,135'; " ^
  "$sc.Save(); " ^
  "Write-Host 'Desktop Shortcut Created Successfully!' -ForegroundColor Green;"

echo.
echo ============================================================
echo   Success! Check your Windows Desktop for:
echo   "LankaCare Pharmacy POS"
echo ============================================================
pause
