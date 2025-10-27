// Simple Node.js Backend for HERB Liquor Wholesale Management System
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle OPTIONS requests
app.options('*', cors());

// Increase body size limit for photos in visits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Data file path
const dataFile = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
  const initialData = {
    products: [],
    customers: [],
    orders: [],
    users: [],
    visits: [],
    customer_portals: [],
    system_logs: []
  };
  fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
}

// Helper function to read data
function readData() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { products: [], customers: [], orders: [], users: [], visits: [], customer_portals: [], system_logs: [] };
  }
}

// Helper function to write data
function writeData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
}

// Helper function to generate ID
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// PRODUCTS API
app.get('/api/products', (req, res) => {
  const data = readData();
  res.json(data.products);
});

app.get('/api/products/:id', (req, res) => {
  const data = readData();
  const product = data.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const data = readData();
  const product = {
    ...req.body,
    id: req.body.id || generateId(),
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  data.products.push(product);
  writeData(data);
  res.json(product);
});

app.put('/api/products/:id', (req, res) => {
  const data = readData();
  const index = data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  
  data.products[index] = {
    ...data.products[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  const data = readData();
  const index = data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  
  data.products.splice(index, 1);
  writeData(data);
  res.json({ message: 'Product deleted' });
});

// CUSTOMERS API
app.get('/api/customers', (req, res) => {
  const data = readData();
  res.json(data.customers);
});

app.get('/api/customers/:id', (req, res) => {
  const data = readData();
  const customer = data.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
});

app.post('/api/customers', (req, res) => {
  const data = readData();
  const customer = {
    ...req.body,
    id: req.body.id || generateId(),
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  data.customers.push(customer);
  writeData(data);
  res.json(customer);
});

app.put('/api/customers/:id', (req, res) => {
  const data = readData();
  const index = data.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer not found' });
  
  data.customers[index] = {
    ...data.customers[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.customers[index]);
});

app.delete('/api/customers/:id', (req, res) => {
  const data = readData();
  const index = data.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer not found' });
  
  data.customers.splice(index, 1);
  writeData(data);
  res.json({ message: 'Customer deleted' });
});

// ORDERS API
app.get('/api/orders', (req, res) => {
  const data = readData();
  res.json(data.orders);
});

app.get('/api/orders/:id', (req, res) => {
  const data = readData();
  const order = data.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const data = readData();
  const order = {
    ...req.body,
    id: req.body.id || generateId(),
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  data.orders.push(order);
  writeData(data);
  res.json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const data = readData();
  const index = data.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Order not found' });
  
  data.orders[index] = {
    ...data.orders[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.orders[index]);
});

app.delete('/api/orders/:id', (req, res) => {
  const data = readData();
  const index = data.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Order not found' });
  
  data.orders.splice(index, 1);
  writeData(data);
  res.json({ message: 'Order deleted' });
});

// USERS API
app.get('/api/users', (req, res) => {
  const data = readData();
  res.json(data.users);
});

app.get('/api/users/:id', (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const data = readData();
  const user = {
    ...req.body,
    id: req.body.id || generateId(),
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  data.users.push(user);
  writeData(data);
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  const data = readData();
  const index = data.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'User not found' });
  
  data.users[index] = {
    ...data.users[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.users[index]);
});

app.delete('/api/users/:id', (req, res) => {
  const data = readData();
  const index = data.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'User not found' });
  
  data.users.splice(index, 1);
  writeData(data);
  res.json({ message: 'User deleted' });
});

// VISITS API
app.get('/api/visits', (req, res) => {
  const data = readData();
  res.json(data.visits || []);
});

app.get('/api/visits/:id', (req, res) => {
  const data = readData();
  const visit = data.visits?.find(v => v.id === req.params.id);
  if (!visit) return res.status(404).json({ message: 'Visit not found' });
  res.json(visit);
});

app.post('/api/visits', (req, res) => {
  const data = readData();
  const visit = {
    ...req.body,
    id: req.body.id || generateId(),
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (!data.visits) data.visits = [];
  data.visits.push(visit);
  writeData(data);
  res.json(visit);
});

app.put('/api/visits/:id', (req, res) => {
  const data = readData();
  if (!data.visits) data.visits = [];
  const index = data.visits.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Visit not found' });
  
  data.visits[index] = {
    ...data.visits[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.visits[index]);
});

app.delete('/api/visits/:id', (req, res) => {
  const data = readData();
  if (!data.visits) data.visits = [];
  const index = data.visits.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Visit not found' });
  
  data.visits.splice(index, 1);
  writeData(data);
  res.json({ message: 'Visit deleted' });
});

// LOGS API
app.get('/api/logs', (req, res) => {
  const data = readData();
  res.json(data.system_logs || []);
});

app.post('/api/logs', (req, res) => {
  const data = readData();
  const log = {
    ...req.body,
    id: generateId(),
    timestamp: new Date().toISOString()
  };
  if (!data.system_logs) data.system_logs = [];
  data.system_logs.push(log);
  writeData(data);
  res.json(log);
});

// SYSTEM LOGS API (alternative endpoint)
app.get('/api/system-logs', (req, res) => {
  const data = readData();
  res.json(data.system_logs || []);
});

app.get('/api/system-logs/:id', (req, res) => {
  const data = readData();
  const log = data.system_logs?.find(l => l.id === req.params.id);
  if (!log) return res.status(404).json({ message: 'System log not found' });
  res.json(log);
});

app.post('/api/system-logs', (req, res) => {
  const data = readData();
  const log = {
    ...req.body,
    id: req.body.id || generateId(),
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (!data.system_logs) data.system_logs = [];
  data.system_logs.push(log);
  writeData(data);
  res.json(log);
});

app.put('/api/system-logs/:id', (req, res) => {
  const data = readData();
  if (!data.system_logs) data.system_logs = [];
  const index = data.system_logs.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'System log not found' });
  
  data.system_logs[index] = {
    ...data.system_logs[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.system_logs[index]);
});

app.delete('/api/system-logs/:id', (req, res) => {
  const data = readData();
  if (!data.system_logs) data.system_logs = [];
  const index = data.system_logs.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'System log not found' });
  
  data.system_logs.splice(index, 1);
  writeData(data);
  res.json({ message: 'System log deleted' });
});

// CUSTOMER PORTALS API
app.get('/api/customer-portals', (req, res) => {
  const data = readData();
  res.json(data.customer_portals || []);
});

app.get('/api/customer-portals/:id', (req, res) => {
  const data = readData();
  const portal = data.customer_portals?.find(p => p.id === req.params.id);
  if (!portal) return res.status(404).json({ message: 'Customer portal not found' });
  res.json(portal);
});

app.post('/api/customer-portals', (req, res) => {
  const data = readData();
  const portal = {
    ...req.body,
    id: req.body.id || generateId(),
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (!data.customer_portals) data.customer_portals = [];
  data.customer_portals.push(portal);
  writeData(data);
  res.json(portal);
});

app.put('/api/customer-portals/:id', (req, res) => {
  const data = readData();
  if (!data.customer_portals) data.customer_portals = [];
  const index = data.customer_portals.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer portal not found' });
  
  data.customer_portals[index] = {
    ...data.customer_portals[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.customer_portals[index]);
});

app.delete('/api/customer-portals/:id', (req, res) => {
  const data = readData();
  if (!data.customer_portals) data.customer_portals = [];
  const index = data.customer_portals.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer portal not found' });
  
  data.customer_portals.splice(index, 1);
  writeData(data);
  res.json({ message: 'Customer portal deleted' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HERB Backend API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HERB Backend API running on port ${PORT}`);
  console.log(`📁 Data file: ${dataFile}`);
});
