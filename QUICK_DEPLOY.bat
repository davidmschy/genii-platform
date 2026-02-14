@echo off
echo ==========================================
echo QUICK DEPLOY TO RAILWAY
echo ==========================================
echo.

cd /d "C:\Users\Administrator\genii-platform"

echo Step 1: Checking Railway CLI...
railway --version > nul 2>&1
if errorlevel 1 (
    echo Installing Railway CLI...
    npm install -g @railway/cli
)

echo.
echo Step 2: Logging into Railway...
echo (Browser will open - login and come back)
railway login

echo.
echo Step 3: Initializing project...
railway init --name genii-platform

echo.
echo Step 4: Adding PostgreSQL database...
railway add --database postgres

echo.
echo Step 5: Setting environment variables...
railway variables set "JWT_SECRET_KEY=genii-secret-$(Get-Random)"
railway variables set "ENVIRONMENT=production"

echo.
echo Step 6: Deploying...
railway up

echo.
echo ==========================================
echo DEPLOYMENT COMPLETE!
echo ==========================================
echo.
echo Your public URL:
railway domain

echo.
pause
