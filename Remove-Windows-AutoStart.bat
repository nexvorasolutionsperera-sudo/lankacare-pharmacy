@echo off
setlocal
echo Removing Aaush Pharmacy from Windows Startup...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$startup = [Environment]::GetFolderPath('Startup'); " ^
  "$file = $startup + '\Aaush Pharmacy.lnk'; " ^
  "if (Test-Path $file) { Remove-Item $file -Force; Write-Host 'Removed from Startup!' -ForegroundColor Green; } " ^
  "else { Write-Host 'Not found in Startup folder.' -ForegroundColor Yellow; }"
echo.
pause
