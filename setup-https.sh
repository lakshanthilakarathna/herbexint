#!/bin/bash
# Setup HTTPS for herbexcellence.store on EC2

echo "🌐 Setting up HTTPS for herbexcellence.store..."

# Update packages
sudo apt update

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
echo "🔒 Getting SSL certificate..."
sudo certbot --nginx -d herbexcellence.store -d www.herbexcellence.store --non-interactive --agree-tos --email admin@herbexcellence.store

# Configure Nginx for HTTPS
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/herbexint > /dev/null <<'NGINX_EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name herbexcellence.store www.herbexcellence.store;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name herbexcellence.store www.herbexcellence.store;
    
    root /var/www/herbexint;
    index index.html;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/herbexcellence.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/herbexcellence.store/privkey.pem;
    
    # SSL optimization
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/json application/xml+rss;
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/herbexint /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
sudo systemctl enable certbot.timer

echo "✅ HTTPS setup complete!"
echo "🌐 Your site is now available at: https://herbexcellence.store"
