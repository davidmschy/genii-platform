#!/bin/bash
# Deploy Genii Platform to VPS
# Run on VPS: curl -fsSL https://platform.geniinow.com/deploy.sh | bash

cd /var/www
mkdir -p genii-platform
cd genii-platform

# Download latest
curl -o server.py https://raw.githubusercontent.com/yourrepo/genii/main/server.py
curl -o index.html https://raw.githubusercontent.com/yourrepo/genii/main/index.html

# Install Python dependencies
pip3 install requests

# Create systemd service
cat > /etc/systemd/system/genii-platform.service << 'EOF'
[Unit]
Description=Genii AI Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/genii-platform
ExecStart=/usr/bin/python3 server.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable genii-platform
systemctl start genii-platform

echo "Genii Platform deployed on port 8080"
echo "Configure Nginx to proxy /genii to localhost:8080"
