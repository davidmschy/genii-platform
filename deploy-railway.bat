@echo off
echo ==========================================
echo GENII PLATFORM - Railway Deployment
echo ==========================================
echo.

REM Check if logged in
railway whoami 2>nul
if errorlevel 1 (
    echo Please login to Railway first...
    railway login
)

echo.
echo Initializing project...
railway init --name genii-platform

echo.
echo Adding PostgreSQL database...
railway add --database postgres

echo.
echo Setting environment variables...
railway variables set "JWT_SECRET_KEY=genii-platform-secret-$(Get-Random)"
railway variables set "STRIPE_SECRET_KEY=sk_test_placeholder"
railway variables set "STRIPE_PUBLISHABLE_KEY=pk_test_placeholder"

echo.
echo Deploying...
railway up

echo.
echo ==========================================
echo Getting domain...
railway domain

echo.
echo ==========================================
echo Deployment Complete!
echo.
echo Next steps:
echo 1. Copy the domain shown above
echo 2. Add it to your Cloudflare DNS as CNAME
echo 3. Update your Stripe webhook URL
pause
