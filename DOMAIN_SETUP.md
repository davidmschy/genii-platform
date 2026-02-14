# Genii Custom Domain Setup
## Domain: geniinow.com

### Current Status
geniinow.com resolves to: 104.248.214.4 (Digital Ocean)

### Option 1: Cloudflare Tunnel with Custom Domain (Recommended)

1. **Install cloudflared with authentication:**
   ```bash
   cloudflared tunnel login
   # This will open browser to authenticate with Cloudflare
   ```

2. **Create named tunnel:**
   ```bash
   cloudflared tunnel create genii-platform
   # Note the tunnel ID output
   ```

3. **Configure DNS in Cloudflare dashboard:**
   - Login to dash.cloudflare.com
   - Select geniinow.com
   - Go to DNS settings
   - Add CNAME record:
     - Name: @ (or www)
     - Target: <tunnel-id>.cfargotunnel.com
     - Proxy status: Enabled (orange cloud)

4. **Create config.yml:**
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: ~/.cloudflared/<tunnel-id>.json
   ingress:
     - hostname: geniinow.com
       service: http://localhost:8080
     - service: http_status:404
   ```

5. **Start tunnel:**
   ```bash
   cloudflared tunnel run genii-platform
   ```

### Option 2: Reverse Proxy on Existing VPS

Since geniinow.com points to 104.248.214.4, configure that server:

1. **SSH into VPS:**
   ```bash
   ssh root@104.248.214.4
   ```

2. **Install nginx:**
   ```bash
   apt update && apt install nginx
   ```

3. **Configure reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name geniinow.com;
       
       location / {
           proxy_pass http://<your-local-ip>:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable SSL with Certbot:**
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d geniinow.com
   ```

### Option 3: Railway/Render Deployment (Easiest)

1. **Deploy to Railway:**
   ```bash
   cd genii-platform
   railway login
   railway init --name genii
   railway up
   ```

2. **Add custom domain in Railway dashboard:**
   - Go to railway.app
   - Select project
   - Settings ? Domains
   - Add geniinow.com

3. **Update DNS:**
   - Point geniinow.com A record to Railway IP
   - Or CNAME to Railway domain

### Mailgun Domain Configuration

1. **Add domain in Mailgun dashboard:**
   - Go to mailgun.com
   - Domains ? Add New Domain
   - Enter: geniinow.com

2. **Update DNS records:**
   Mailgun will provide DNS records to add:
   - TXT records for SPF/DKIM
   - MX records for receiving

3. **Verify domain:**
   - Click "Verify" in Mailgun
   - Wait for DNS propagation

### Environment Variables Needed

Create .env file:
```
# Database
DATABASE_URL=sqlite:///genii.db

# OpenClaw
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_TOKEN=your-token-here

# Mailgun
MAILGUN_API_KEY=key-xxxxxxxxxx
MAILGUN_DOMAIN=geniinow.com

# Custom Domain
DOMAIN=geniinow.com

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_xxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxx
```

### Testing

1. **Test local:**
   ```bash
   curl http://localhost:8080/api/health
   ```

2. **Test tunnel:**
   ```bash
   curl https://meeting-visiting-sara-five.trycloudflare.com/api/health
   ```

3. **Test custom domain:**
   ```bash
   curl https://geniinow.com/api/health
   ```

### SSL Certificate

Cloudflare and Railway provide SSL automatically.
For VPS: Use Certbot (shown above).

### Next Steps

1. Choose deployment option
2. Configure DNS
3. Set environment variables
4. Test end-to-end
5. Launch!
