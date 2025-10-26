# Backend Setup on EC2 - Complete Guide

## Current Status
✅ Frontend: Deployed on EC2 with Nginx
✅ Backend Server: Created (`backend/server.js`)
✅ API Client: Updated to use backend API
⏳ Backend: Not yet deployed

## Step 1: Deploy Backend to EC2

### SSH into EC2
```bash
ssh -i ~/Downloads/herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com
```

### Create Backend Directory
```bash
cd /var/www
sudo mkdir -p herbexint-api
cd herbexint-api
sudo chown -R ubuntu:ubuntu /var/www/herbexint-api
```

### Upload Backend Files

**From your local machine (new terminal):**
```bash
cd /Users/nextmac/Downloads/herbexint

# Copy backend files to EC2
scp -i ~/Downloads/herbexint.pem -r backend/* ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com:/var/www/herbexint-api/
```

### Install Backend Dependencies (on EC2)
```bash
cd /var/www/herbexint-api
npm install
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name herb-backend
pm2 save
pm2 startup
# Follow the instructions to auto-start on reboot
```

### Check Backend Status
```bash
pm2 status
pm2 logs herb-backend
```

Test the backend:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"ok","message":"HERB Backend API is running"}
```

---

## Step 2: Update Nginx Configuration

### Create New Nginx Config
```bash
sudo nano /etc/nginx/sites-available/herbexint
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name ec2-13-41-78-113.eu-west-2.compute.amazonaws.com;
    
    root /var/www/herbexint;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

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

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 3: Test Backend Connection

### From EC2
```bash
curl http://localhost:3001/api/health
```

### From Your Browser
```
http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/health
```

Expected: `{"status":"ok","message":"HERB Backend API is running"}`

### Test Frontend → Backend
1. Open your website: `http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com`
2. Open browser DevTools (F12) → Network tab
3. Try adding a product
4. Check if request goes to `/api/products` ✅

---

## Step 4: Update GitHub Actions (Auto-Deploy Backend)

### Update .github/workflows/deploy.yml
```yaml
name: Deploy to AWS EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    # Backend Deployment
    - name: Deploy Backend
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
        REMOTE_HOST: ${{ secrets.EC2_HOST }}
        REMOTE_USER: ubuntu
        SOURCE: "backend/*"
        TARGET: "/var/www/herbexint-api"
        ARGS: "-avz --delete"

    - name: Restart Backend
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
        REMOTE_HOST: ${{ secrets.EC2_HOST }}
        REMOTE_USER: ubuntu
        PRE_COMMANDS: "cd /var/www/herbexint-api && npm install"
        SCRIPT: "cd /var/www/herbexint-api && pm2 restart herb-backend || pm2 start server.js --name herb-backend && pm2 save"

    # Frontend Deployment
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Deploy Frontend
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
        REMOTE_HOST: ${{ secrets.EC2_HOST }}
        REMOTE_USER: ubuntu
        SOURCE: "dist/*"
        TARGET: "/var/www/herbexint"
```

---

## Troubleshooting

### Backend not starting
```bash
cd /var/www/herbexint-api
pm2 logs herb-backend
pm2 restart herb-backend
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://localhost:3001/api/health
```

### API calls fail from frontend
1. Check browser console (F12) for errors
2. Check Network tab for failed requests
3. Verify Nginx proxy config: `sudo nginx -t`

---

## Success! 🎉

Your system now has:
- ✅ Frontend on EC2 (port 80)
- ✅ Backend API on EC2 (port 3001)
- ✅ Nginx reverse proxy
- ✅ All data stored server-side (not localStorage!)
- ✅ Multi-user support
- ✅ Data sync across devices

**Test it:**
1. Add a product on Device A
2. Open the same URL on Device B
3. Product should appear! 🎊

