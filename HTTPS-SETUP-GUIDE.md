# HTTPS Setup Guide for herbexcellence.store

## Prerequisites
- Domain: herbexcellence.store
- EC2 IP: 13.41.78.113
- EC2 Hostname: ec2-13-41-78-113.eu-west-2.compute.amazonaws.com

## Step 1: Point Your Domain to EC2

In your domain registrar (where you bought herbexcellence.store):

1. Go to DNS management
2. Add these DNS records:

```
Type: A
Name: @
Value: 13.41.78.113
TTL: 3600

Type: A
Name: www
Value: 13.41.78.113
TTL: 3600
```

**Wait 15-30 minutes for DNS to propagate**

## Step 2: Connect to EC2 Server

```bash
ssh -i herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com
```

## Step 3: Install Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## Step 4: Get SSL Certificate

```bash
sudo certbot --nginx -d herbexcellence.store -d www.herbexcellence.store
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (choose Yes)

## Step 5: Verify HTTPS Works

```bash
# Test your domain
curl -I https://herbexcellence.store

# Should see HTTP/2 200 or similar
```

## Step 6: Update Your Deployment

After HTTPS is set up, you can test GPS location by:
1. Going to https://herbexcellence.store
2. Click "🧪 Test Location" button
3. Allow location access
4. GPS should work perfectly!

## Troubleshooting

### DNS not resolving yet?
```bash
# Check DNS propagation
nslookup herbexcellence.store
dig herbexcellence.store
```

### Certbot fails?
- Make sure DNS is pointing to EC2
- Make sure ports 80 and 443 are open in EC2 security group
- Wait a bit longer for DNS propagation

### Need to renew certificate?
Certbot auto-renews certificates, but you can manually renew:
```bash
sudo certbot renew
```

## After Setup

✅ Your site will be available at:
- https://herbexcellence.store
- https://www.herbexcellence.store

✅ HTTP will automatically redirect to HTTPS

✅ GPS location tracking will work perfectly!

## Security Group Rules

Make sure your EC2 security group has these ports open:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3001 (Backend API)
