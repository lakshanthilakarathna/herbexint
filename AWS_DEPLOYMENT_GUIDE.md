# AWS EC2 Deployment Guide for HERB

## Quick Summary

Your application is now configured to automatically deploy to AWS EC2 using GitHub Actions.

## What Was Done

1. Created GitHub Actions workflow (`.github/workflows/deploy.yml`)
2. Build is working (tested successfully)
3. Nginx configured on EC2 server
4. Ready to set up GitHub Secrets

## Your EC2 Details

- **Host**: `ec2-13-41-78-113.eu-west-2.compute.amazonaws.com`
- **IP**: `13.41.78.113`
- **Region**: EU West 2 (London)
- **User**: `ubuntu`
- **Deploy Path**: `/var/www/herbexint`

## Setup Steps

### 1. Get SSH Key for GitHub Actions

On your EC2 server, you already generated the SSH key. Get the private key:

```bash
# On EC2 (if you're still connected)
cat ~/.ssh/github_actions

# If not connected, SSH to EC2 first:
ssh -i herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com
cat ~/.ssh/github_actions
```

### 2. Add GitHub Secrets

Go to your GitHub repository: https://github.com/lakshanthilakarathna/herbexint

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these 2 secrets:

#### Secret 1: EC2_SSH_KEY
- Name: `EC2_SSH_KEY`
- Value: Paste the output from `cat ~/.ssh/github_actions` (the entire private key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

#### Secret 2: EC2_HOST
- Name: `EC2_HOST`
- Value: `13.41.78.113`

### 3. Push to GitHub

```bash
# Add and commit deployment files
git add .github/
git commit -m "Add AWS EC2 deployment workflow"
git push origin main
```

### 4. Watch Deployment

Go to your GitHub repository → **Actions** tab

You should see the deployment start automatically!

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build locally
npm run build

# Copy to EC2
scp -i herbexint.pem -r dist/* ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com:/var/www/herbexint/

# On EC2, restart Nginx
ssh -i herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com
sudo systemctl reload nginx
```

## Access Your Application

Once deployed, access at:

**http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com**

## Setup SSL (Optional)

To enable HTTPS:

```bash
# SSH to EC2
ssh -i herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain if you have one)
sudo certbot --nginx -d ec2-13-41-78-113.eu-west-2.compute.amazonaws.com

# Or if you have a custom domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Troubleshooting

### Deployment fails with "Permission denied"

Fix SSH key permissions:
```bash
chmod 600 ~/.ssh/github_actions
chmod 600 ~/.ssh/authorized_keys
```

### Nginx not serving files

Check Nginx status:
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Application not loading

Check file permissions:
```bash
sudo chown -R ubuntu:ubuntu /var/www/herbexint
```

## GitHub Actions Workflow Details

The workflow automatically:
1. Runs on every push to `main` branch
2. Can be manually triggered from Actions tab
3. Builds the application
4. Deploys to `/var/www/herbexint/dist`
5. Serves via Nginx

## Next Steps

1. ✅ Add GitHub Secrets (EC2_SSH_KEY and EC2_HOST)
2. ✅ Push to GitHub
3. ✅ Watch deployment in Actions tab
4. ✅ Test your live application
5. ⚠️ Setup SSL for HTTPS (optional)

Your HERB Liquor Wholesale Management System is ready to deploy! 🎉
