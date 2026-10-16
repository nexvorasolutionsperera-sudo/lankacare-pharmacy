@echo off
setlocal
echo ============================================================
echo          Aaush Pharmacy - Stopping Server
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$conns = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue; " ^
  "if ($conns) { " ^
  "  foreach ($c in $conns) { " ^
  "    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; " ^
  "    Write-Host ('Stopped Pharmacy Server Process PID: ' + $c.OwningProcess) -ForegroundColor Yellow; " ^
  "  } " ^
  "  Write-Host 'Server stopped successfully!' -ForegroundColor Green; " ^
  "} else { " ^
  "  Write-Host 'Server is not running on port 5000.' -ForegroundColor Cyan; " ^
  "}"

echo.
echo Server has been closed.
timeout /t 2 >nul
exit
