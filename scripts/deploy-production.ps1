<#
.SYNOPSIS
    Intel24 Console - Production Deployment Script

.DESCRIPTION
    Deploys Intel24 Console to production with SSO configuration.
    Ensures SSO_JWT_SECRET is set and validates the deployment.

.NOTES
    Author: Intel24 Development Team
    Date: 2 Dec 2025
    Version: 1.0.0
#>

param(
  [Parameter(Mandatory = $false)]
  [string]$SsoSecret,

  [Parameter(Mandatory = $false)]
  [switch]$SkipBuild,

  [Parameter(Mandatory = $false)]
  [switch]$LocalTest
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Intel24 Console - Production Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Step 1: Validate SSO Secret
# ============================================================================

Write-Host "[1/5] Validating SSO Configuration..." -ForegroundColor Yellow

if ($SsoSecret) {
  $env:SSO_JWT_SECRET = $SsoSecret
  Write-Host "  ✓ SSO_JWT_SECRET set from parameter" -ForegroundColor Green
}
elseif ($env:SSO_JWT_SECRET) {
  Write-Host "  ✓ SSO_JWT_SECRET found in environment" -ForegroundColor Green
}
else {
  Write-Host "  ✗ SSO_JWT_SECRET not configured!" -ForegroundColor Red
  Write-Host ""
  Write-Host "  Set it using one of these methods:" -ForegroundColor Yellow
  Write-Host "    1. Pass as parameter: -SsoSecret '<secret>'" -ForegroundColor Gray
  Write-Host "    2. Set environment: `$env:SSO_JWT_SECRET = '<secret>'" -ForegroundColor Gray
  Write-Host "    3. Add to .env.local file" -ForegroundColor Gray
  Write-Host ""

  if (-not $LocalTest) {
    exit 1
  }
  Write-Host "  (Continuing in local test mode without SSO)" -ForegroundColor Yellow
}

# Validate secret length (should be 64 hex chars = 256 bits)
if ($env:SSO_JWT_SECRET -and $env:SSO_JWT_SECRET.Length -ne 64) {
  Write-Host "  ⚠ Warning: SSO_JWT_SECRET should be 64 hex characters (256-bit)" -ForegroundColor Yellow
  Write-Host "    Current length: $($env:SSO_JWT_SECRET.Length)" -ForegroundColor Gray
}

# ============================================================================
# Step 2: Install Dependencies
# ============================================================================

Write-Host ""
Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow

Push-Location $ProjectRoot
try {
  npm install --silent 2>$null
  Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
}
catch {
  Write-Host "  ✗ Failed to install dependencies: $_" -ForegroundColor Red
  exit 1
}
finally {
  Pop-Location
}

# ============================================================================
# Step 3: Build Application
# ============================================================================

if (-not $SkipBuild) {
  Write-Host ""
  Write-Host "[3/5] Building application..." -ForegroundColor Yellow

  Push-Location $ProjectRoot
  try {
    npm run build 2>&1 | Out-Null
    Write-Host "  ✓ Build completed" -ForegroundColor Green
  }
  catch {
    Write-Host "  ✗ Build failed: $_" -ForegroundColor Red
    exit 1
  }
  finally {
    Pop-Location
  }
}
else {
  Write-Host ""
  Write-Host "[3/5] Skipping build (--SkipBuild)" -ForegroundColor Gray
}

# ============================================================================
# Step 4: Start Server
# ============================================================================

Write-Host ""
Write-Host "[4/5] Starting server..." -ForegroundColor Yellow

$env:NODE_ENV = "production"
$env:PORT = "3001"

Push-Location $ProjectRoot
try {
  # Start in background using Start-Process
  $serverProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow -WorkingDirectory $ProjectRoot

  # Wait for server to start
  Write-Host "  Waiting for server to start..." -ForegroundColor Gray
  Start-Sleep -Seconds 3

  if ($serverProcess.HasExited) {
    Write-Host "  ✗ Server failed to start" -ForegroundColor Red
    exit 1
  }

  Write-Host "  ✓ Server started (PID: $($serverProcess.Id))" -ForegroundColor Green
}
finally {
  Pop-Location
}

# ============================================================================
# Step 5: Validate Deployment
# ============================================================================

Write-Host ""
Write-Host "[5/5] Validating deployment..." -ForegroundColor Yellow

$baseUrl = "http://localhost:3001"

# Test health endpoint
try {
  $healthResponse = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing -TimeoutSec 5
  if ($healthResponse.StatusCode -eq 200) {
    Write-Host "  ✓ /api/health → 200 OK" -ForegroundColor Green
  }
}
catch {
  Write-Host "  ✗ /api/health failed: $_" -ForegroundColor Red
}

# Test SSO health endpoint
try {
  $ssoHealthResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/sso-health" -UseBasicParsing -TimeoutSec 5
  $ssoHealth = $ssoHealthResponse.Content | ConvertFrom-Json

  Write-Host "  ✓ /api/auth/sso-health → 200 OK" -ForegroundColor Green
  Write-Host "    - expectedIss: $($ssoHealth.expectedIss)" -ForegroundColor Gray
  Write-Host "    - expectedAud: $($ssoHealth.expectedAud)" -ForegroundColor Gray
  Write-Host "    - secretConfigured: $($ssoHealth.secretConfigured)" -ForegroundColor $(if ($ssoHealth.secretConfigured) { "Green" } else { "Red" })
  Write-Host "    - usesHS256: $($ssoHealth.usesHS256)" -ForegroundColor Gray
}
catch {
  Write-Host "  ✗ /api/auth/sso-health failed: $_" -ForegroundColor Red
}

# ============================================================================
# Summary
# ============================================================================

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server running at: http://localhost:$env:PORT" -ForegroundColor White
Write-Host "  Process ID: $($serverProcess.Id)" -ForegroundColor White
Write-Host "  SSO Configured: $(if ($env:SSO_JWT_SECRET) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($env:SSO_JWT_SECRET) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "  To stop: Stop-Process -Id $($serverProcess.Id)" -ForegroundColor Gray
Write-Host ""

# Return process for further use
return $serverProcess
