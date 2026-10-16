# Aaush Pharmacy - Silent Background Launcher
# Starts server silently if not running, then opens dedicated Desktop App window

$ErrorActionPreference = "SilentlyContinue"
$rootDir = $PSScriptRoot
Set-Location $rootDir

# Check if port 5000 is already active
$isListening = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

if (-not $isListening) {
    # Start Node server completely hidden
    Start-Process -FilePath "node" -ArgumentList "server/server.js" -WorkingDirectory $rootDir -WindowStyle Hidden
    
    # Wait for server to respond
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/system/status" -UseBasicParsing -TimeoutSec 1
            if ($resp.StatusCode -eq 200) {
                break
            }
        } catch { }
    }
}

$url = "http://localhost:5000"

# Find browser that supports App Mode (Edge or Chrome)
$browserCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
)

$targetBrowser = $null
foreach ($path in $browserCandidates) {
    if ($path -and (Test-Path $path)) {
        $targetBrowser = $path
        break
    }
}

if ($targetBrowser) {
    # Opens as a native app window (no URL bar, no tabs)
    Start-Process -FilePath $targetBrowser -ArgumentList "--app=$url"
} else {
    # Fallback to default browser
    Start-Process $url
}
