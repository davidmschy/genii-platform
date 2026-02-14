#!/bin/bash
# Genii AI Platform - Deploy Script
# Usage: ./deploy.sh

echo "?? Deploying Genii AI Workforce Platform..."

# 1. Railway Login
echo "Logging into Railway..."
railway login

# 2. Create project
echo "Creating project..."
cd "$(dirname "$0")"
railway init --name genii-platform

# 3. Add PostgreSQL
echo "Adding PostgreSQL database..."
railway add --database postgres

# 4. Set environment variables
echo "Setting environment variables..."
railway variables set "DATABASE_URL=${{Postgres.DATABASE_URL}}"
railway variables set "OPENCLAW_GATEWAY_URL=http://localhost:18789"
railway variables set "OPENCLAW_TOKEN=your-token-here"
railway variables set "MAILGUN_API_KEY=your-key-here"
railway variables set "MAILGUN_DOMAIN=geniiai.com"
railway variables set "TWILIO_ACCOUNT_SID=your-sid-here"
railway variables set "TWILIO_AUTH_TOKEN=your-token-here"
railway variables set "TWILIO_PHONE_NUMBER=+1555GENII01"

# 5. Deploy
echo "Deploying..."
railway up

# 6. Get domain
DOMAIN=$(railway domain)
echo "? Deployed to: $DOMAIN"
echo ""
echo "Next steps:"
echo "1. Configure DNS for geniiai.com"
echo "2. Set up Mailgun for email"
echo "3. Set up Twilio for SMS"
echo "4. Configure OpenClaw gateway"
