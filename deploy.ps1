# Genii AI Platform - Deploy Script (Windows)
# Usage: .\deploy.ps1

Write-Host "?? Deploying Genii AI Workforce Platform..." -ForegroundColor Cyan

# Check prerequisites
$railway = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railway) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Login
Write-Host "Logging into Railway..." -ForegroundColor Yellow
railway login

# Create project
Write-Host "Creating project..." -ForegroundColor Yellow
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath
railway init --name genii-platform

# Add PostgreSQL
Write-Host "Adding PostgreSQL..." -ForegroundColor Yellow
railway add --database postgres

Write-Host ""
Write-Host "??  Manual steps required:" -ForegroundColor Yellow
Write-Host "1. Set environment variables in Railway dashboard"
Write-Host "2. Deploy: railway up"
Write-Host "3. Get domain: railway domain"
Write-Host ""
Write-Host "Required environment variables:" -ForegroundColor Cyan
Write-Host "- DATABASE_URL"
Write-Host "- OPENCLAW_GATEWAY_URL"
Write-Host "- OPENCLAW_TOKEN"
Write-Host "- MAILGUN_API_KEY"
Write-Host "- TWILIO_ACCOUNT_SID"
