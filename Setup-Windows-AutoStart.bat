@echo off
setlocal
echo ============================================================
echo   Setting up Aaush Pharmacy to Auto-Start on PC Boot...
echo ============================================================
echo.

set SCRIPT_DIR=%~dp0
if "%SCRIPT_DIR:~-1%"=="\" set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$startup = [Environment]::GetFolderPath('Startup'); " ^
  "$sc = $ws.CreateShortcut($startup + '\Aaush Pharmacy.lnk'); " ^
  "$sc.TargetPath = 'wscript.exe'; " ^
  "$sc.Arguments = '\"" + '%SCRIPT_DIR%\Aaush-Pharmacy.vbs' + '\"'; " ^
  "$sc.WorkingDirectory = '%SCRIPT_DIR%'; " ^
  "$sc.Description = 'Aaush Pharmacy Auto-Start'; " ^
  "if (Test-Path '%SCRIPT_DIR%\aaush-icon.ico') { " ^
  "  $sc.IconLocation = '%SCRIPT_DIR%\aaush-icon.ico,0'; " ^
  "} else { " ^
  "  $sc.IconLocation = '%SystemRoot%\System32\shell32.dll,135'; " ^
  "} " ^
  "$sc.Save(); " ^
  "Write-Host 'Autostart configured successfully in Windows Startup!' -ForegroundColor Green;"

echo.
echo ============================================================
echo   Done! When this computer turns on, Aaush Pharmacy will 
echo   launch automatically in silent app window mode (No Terminal)!
echo ============================================================
echo.
pause
