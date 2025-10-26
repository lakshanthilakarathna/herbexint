# Adding Backend to EC2 - Complete Guide

## Current Status
✅ Frontend: Deployed on EC2 with Nginx
⚠️ Backend: No backend (using localStorage)

## What You Need for Backend

### Option 1: Simple Node.js Backend (Recommended) ⭐

**Setup on EC2:**
```bash
# SSH into EC2
ssh -i ~/Downloads/herbexint.pem ubuntu@ec2-13-41-78-113.eu-west-2.compute.amazonaws.com

# Install Node.js (already done)
node --version

# Create backend directory
cd /var/www
sudo mkdir herbexint-api
cd herbexint-api

# Initialize Node.js project
npm init -y
npm install express cors body-parser

# Install PostgreSQL or SQLite
sudo apt install postgresql  # For production
# OR
npm install better-sqlite3  # Simpler, for small projects
```

**Create Simple API Server:**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple JSON file storage (or use database)
const fs = require('fs');
const dataFile = './data.json';

let data = {
  products: [],
  customers: [],
  orders: [],
  users: []
};

// Load data
if (fs.existsSync(dataFile)) {
  data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

// Save data function
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Products API
app.get('/api/products', (req, res) => res.json(data.products));
app.post('/api/products', (req, res) => {
  const product = { ...req.body, id: Date.now().toString() };
  data.products.push(product);
  saveData();
  res.json(product);
});

// Customers API
app.get('/api/customers', (req, res) => res.json(data.customers));
app.post('/api/customers', (req, res) => {
  const customer = { ...req.body, id: Date.now().toString() };
  data.customers.push(customer);
  saveData();
  res.json(customer);
});

// Orders API
app.get('/api/orders', (req, res) => res.json(data.orders));
app.post('/api/orders', (req, res) => {
  const order = { ...req.body, id: Date.now().toString() };
  data.orders.push(order);
  saveData();
  res.json(order);
});

// Start server
app.listen(3001, () => console.log('Backend running on port 3001'));
```

**Run Backend with PM2:**
```bash
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```

**Update Nginx to Proxy Backend:**
```nginx
# /etc/nginx/sites-available/herbexint
server {
    listen 80;
    server_name ec2-13-41-78-113.eu-west-2.compute.amazonaws.com;
    
    root /var/www/herbexint;
    index index.html;

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Update Frontend API Client:**
```typescript
// src/services/apiClient.ts
const API_BASE_URL = 'http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api';

async getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);
  return response.json();
}

async createProduct(product) {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return response.json();
}
```

---

### Option 2: Full AWS Backend (Advanced)

**Services Needed:**
- DynamoDB (database)
- Lambda (functions)
- API Gateway (API)
- Cognito (auth)

**Cost:** ~$20-50/month (depends on usage)

**Setup:**
```bash
npm install -g @aws-amplify/cli
amplify init
amplify add api
amplify add auth
amplify push
```

---

### Option 3: Keep Current (localStorage)

**Pros:**
- ✅ Free
- ✅ Simple
- ✅ Fast
- ✅ No backend needed

**Cons:**
- ❌ Data only on one browser
- ❌ Can't share between devices/users
- ❌ Risk of data loss

---

## Recommendation

**For Now:** Keep localStorage (it's working!)

**When to Add Backend:**
- Need multi-user access
- Need data sync across devices
- Need backup/restore
- Need historical data tracking

---

## Quick Decision Guide

**Choose Option 1 if:**
- ✅ Want simple backend
- ✅ 1-10 users
- ✅ Single EC2 instance
- ✅ Easy to maintain

**Choose Option 2 if:**
- ✅ Want AWS services
- ✅ Need scaling
- ✅ Want managed services
- ✅ Budget available

**Keep localStorage if:**
- ✅ Single user
- ✅ Single device
- ✅ Simple use case
- ✅ Cost is concern

---

## Which do you prefer?

A) Add simple Node.js backend on EC2 (Option 1) - 1-2 hours setup
B) Keep localStorage (Current) - Already working!
C) Migrate to full AWS backend (Option 2) - More complex, powerful

Let me know! 🚀

