#!/bin/bash
set -e

echo "🚀 Starting Post-Deployment Setup..."

# --- Variables ---
# These should be passed from the GitHub Action environment
DOMAIN_NAME="${DOMAIN_NAME:-}"
SSL_EMAIL="${SSL_EMAIL:-}"
# Use current directory as deploy path if not set, assuming script is run from project root
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/work-manager}"

echo "🔧 Config: Domain=$DOMAIN_NAME, Path=$DEPLOY_PATH"

# --- 1. System Dependencies (Node, pnpm, PM2) ---

if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is installed ($(node -v))"
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found. Installing..."
    sudo npm install -g pnpm
else
     echo "✅ pnpm is installed ($(pnpm -v))"
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is installed"
fi

# --- 2. Web Server (Nginx) ---

if ! command -v nginx &> /dev/null; then
    echo "📦 Nginx not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y nginx
else
    echo "✅ Nginx is installed"
fi

# Configure Nginx
echo "🔧 Configuring Nginx sites-available/default..."
cat << NGINX_CONF | sudo tee /etc/nginx/sites-available/default > /dev/null
# Catch-all block to drop requests to IP or unmatched domains
server {
    listen 80 default_server;
    server_name _;
    return 444; # Connection closed without response
}

# Main site block
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_CONF

# Test and Reload
echo "🔄 Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

# --- 3. SSL Configuration (Certbot) ---

if ! command -v certbot &> /dev/null; then
    echo "📦 Certbot not found. Installing..."
    sudo apt-get install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot is installed"
fi

# Only run Certbot if DOMAIN_NAME is set and not empty
if [ -n "$DOMAIN_NAME" ] && [ -n "$SSL_EMAIL" ]; then
    echo "🔒 Checking SSL for $DOMAIN_NAME..."
    # Check if certificate already exists to avoid rate limits/errors
    if sudo certbot certificates | grep -q "$DOMAIN_NAME"; then
        echo "✅ SSL Certificate already exists. Renewing if needed..."
        # Optional: Force renewal check or just let cron handle it
    else
        echo "🆕 Requesting new SSL Certificate..."
        sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect --keep-until-expiring || echo "⚠️ SSL Certbot failed (DNS might not be propagated yet). Continuing..."
    fi
else
    echo "⚠️ Skipping SSL: DOMAIN_NAME or SSL_EMAIL not set."
fi

# --- 4. Application Directory Setup ---

echo "📝 configuring log directory..."
if [ ! -d "/var/log/work-manager" ]; then
    sudo mkdir -p "/var/log/work-manager"
fi
sudo chown -R $USER:$USER "/var/log/work-manager"

echo "✅ Post-Deployment Setup Complete!"
