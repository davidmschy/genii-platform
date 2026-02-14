# ?? GENII PLATFORM - COMPLETE SETUP GUIDE

## ? COMPLETED

### 1. Cloudflare Tunnel (In Progress)
**Status:** Waiting for authentication
**Action Required:** Visit the URL provided to authenticate with Cloudflare

### 2. Railway Deployment (Ready)
**Status:** Config files created
**Files:** railway.toml, Dockerfile

### 3. Affiliate Links (Needs Your IDs)
**Status:** Template created at AFFILIATE_CONFIG.txt
**Action Required:** Replace YOUR_*_CODE with your actual affiliate IDs

### 4. Stripe Integration (Ready to Connect)
**Status:** Module created at backend/routers/stripe.py
**Action Required:** Set environment variables with your Stripe keys

---

## ?? IMMEDIATE ACTION ITEMS

### A. Complete Cloudflare Tunnel Setup
```bash
# After authenticating in browser, run:
cloudflared tunnel create genii-erp
cloudflared tunnel route dns genii-erp geniinow.com
cloudflared tunnel run genii-erp
```

### B. Deploy to Railway
```bash
cd C:\Users\Administrator\genii-platform
railway login
railway init --name genii-platform
railway add --database postgres
railway up
# Get domain from: railway domain
```

### C. Configure Affiliate Links
Edit `AFFILIATE_CONFIG.txt` and replace placeholders:
- Get Vultr affiliate link: https://www.vultr.com/referral/
- Get DigitalOcean referral: https://www.digitalocean.com/referral-program/
- Get Kimi referral: Check your Kimi account settings
- etc.

### D. Connect Stripe
1. Go to https://dashboard.stripe.com/register
2. Get API keys from https://dashboard.stripe.com/apikeys
3. Set environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## ?? REVENUE SYSTEM

### Current Status
- **Total Revenue:** $0.00 (fresh start)
- **MRR:** $0.00
- **Sales:** 0

### Subscription Tiers
| Tier | Price | Commission |
|------|-------|------------|
| Starter | $99/mo | 20% |
| Pro | $299/mo | 25% |
| Enterprise | $999/mo | 30% |
| White Glove | $2,500/mo | 35% |

### Revenue Endpoints
- `GET /revenue/dashboard` - View revenue metrics
- `POST /revenue/record-sale` - Record a new sale
- `GET /revenue/sales` - View all sales history

---

## ?? CUSTOM DOMAIN

### DNS Configuration
Once Cloudflare tunnel is running:
1. **A Record:** geniinow.com ? Tunnel ID
2. **CNAME:** www ? geniinow.com
3. **CNAME:** api ? geniinow.com

### SSL
Automatic via Cloudflare

---

## ?? MONITORING

### Health Check
http://localhost:8001/health

### Dashboard
http://localhost:8001/dashboard

### API Docs
http://localhost:8001/docs

---

## ?? NEXT STEPS

1. [ ] Complete Cloudflare authentication
2. [ ] Get your affiliate IDs and update AFFILIATE_CONFIG.txt
3. [ ] Create Stripe account and add API keys
4. [ ] Deploy to Railway for public access
5. [ ] Test first sale via /marketplace/purchase
6. [ ] Launch outreach campaign via /outreach/campaigns

---

## ?? SUPPORT

If any step fails:
1. Check server logs: `Get-Process python | Select-Object Id,CommandLine`
2. Test health: `Invoke-RestMethod http://localhost:8001/health`
3. Restart: Kill Python processes and restart
