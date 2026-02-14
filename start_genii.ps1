# start_genii.ps1
# This script starts the Genii Autonomous ERP (Backend and Frontend)

Write-Host "--- Starting Genii Autonomous OS ---" -ForegroundColor Cyan

# 1. Start Backend
Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn main:app --reload --port 8000"

# 2. Start Frontend
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "--- Genii Initialization Complete ---" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Ops Control: http://localhost:3000/ops"
