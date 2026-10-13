@echo off
setlocal
echo ============================================================
echo   Setting up LankaCare Pharmacy POS to Run on PC Startup...
echo ============================================================

set SCRIPT_DIR=%~dp0
if "%SCRIPT_DIR:~-1%"=="\" set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$startup = [Environment]::GetFolderPath('Startup'); " ^
  "$sc = $ws.CreateShortcut($startup + '\LankaCare Pharmacy POS.lnk'); " ^
  "$sc.TargetPath = 'wscript.exe'; " ^
  "$sc.Arguments = '\"" + '%SCRIPT_DIR%\LankaCare-Pharmacy-Silent.vbs' + '\"'; " ^
  "$sc.WorkingDirectory = '%SCRIPT_DIR%'; " ^
  "$sc.Description = 'LankaCare Pharmacy POS & Management System Autostart'; " ^
  "$sc.IconLocation = '%SystemRoot%\System32\shell32.dll,135'; " ^
  "$sc.Save(); " ^
  "Write-Host 'Autostart configured successfully in Windows Startup!' -ForegroundColor Green;"

echo.
echo ============================================================
echo   Done! When this PC turns on, LankaCare Pharmacy POS will 
echo   launch automatically in full browser app mode!
echo ============================================================
pause
