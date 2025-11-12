#!/bin/bash

# Fix Nginx Configuration for Work Manager
# This script configures Nginx to proxy to your Next.js application

set -e

DOMAIN="${1:-management.primelinkexim.com}"
APP_NAME="work-manager"

echo "🔧 Fixing Nginx configuration for ${DOMAIN}"

# Check if PM2 app is running
echo "📊 Checking PM2 status..."
pm2 status

# Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
sudo bash -c "cat > /etc/nginx/sites-available/${APP_NAME} << 'EOF'
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=general_limit:10m rate=30r/s;

# Upstream
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;

    # Logging
    access_log /var/log/nginx/${APP_NAME}-access.log;
    error_log /var/log/nginx/${APP_NAME}-error.log;

    # Client body size limit
    client_max_body_size 10M;

    # Rate limiting for API routes
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # General rate limiting
    location / {
        limit_req zone=general_limit burst=50 nodelay;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control \"public, max-age=3600, immutable\";
    }

    # Health check endpoint (no rate limiting)
    location /api/health {
        proxy_pass http://nextjs_backend;
        access_log off;
    }
}
EOF"

# Enable the site
echo "✅ Enabling site configuration..."
sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}

# Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️  Removing default Nginx site..."
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "♻️  Reloading Nginx..."
sudo systemctl reload nginx

# Check if app is accessible
echo "🏥 Testing application..."
sleep 2
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is running!"
else
    echo "⚠️  Warning: Application health check failed"
    echo "   Checking PM2 logs..."
    pm2 logs work-manager --lines 20 --nostream
fi

echo ""
echo "✅ Nginx configuration updated!"
echo "🌐 Your site should now be accessible at:"
echo "   http://${DOMAIN}"
echo ""
echo "Next steps:"
echo "1. Test your site: curl http://${DOMAIN}/api/health"
echo "2. If working, install SSL: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
