# DNS Configuration for geniinow.com

## Cloudflare DNS Records to Add (after nameservers propagate):

### Option 1: CNAME (recommended for tunnels)
Type: CNAME
Name: @
Target: genii-erp-tunnel.cfargotunnel.com
TTL: Auto
Proxy: Enabled (orange cloud)

Type: CNAME
Name: www
Target: geniinow.com
TTL: Auto
Proxy: Enabled

Type: CNAME
Name: api
Target: geniinow.com
TTL: Auto
Proxy: Enabled

### Option 2: A Record (if you have a static IP)
Type: A
Name: @
IPv4: YOUR_SERVER_IP
TTL: Auto
Proxy: Enabled

## After DNS propagates:
1. Authenticate: cloudflared tunnel login
2. Create tunnel: cloudflared tunnel create genii-erp
3. Run tunnel: cloudflared tunnel run genii-erp
4. Access at: https://geniinow.com

## SSL/TLS Settings in Cloudflare Dashboard:
- SSL/TLS encryption mode: Full (strict)
- Always Use HTTPS: ON
- Automatic HTTPS Rewrites: ON
