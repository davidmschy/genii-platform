@echo off
echo Starting Cloudflare Tunnel for geniinow.com...
echo.
echo This will connect your local ERP to the internet via Cloudflare
echo.
cd /d C:\Users\Administrator\genii-platform
cloudflared tunnel run genii-erp
pause
