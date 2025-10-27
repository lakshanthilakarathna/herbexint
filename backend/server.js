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
    customer_orders: [],
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
    return { products: [], customers: [], orders: [], users: [], visits: [], customer_portals: [], customer_orders: [], system_logs: [] };
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

// Get all orders (including customer portal orders) for reports
app.get('/api/orders/all', (req, res) => {
  const data = readData();
  const allOrders = [
    ...(data.orders || []),
    ...(data.customer_orders || []).map(co => ({
      ...co,
      source: 'customer-portal',
      order_number: co.order_number || `CP-${co.id}`,
      customer_id: co.portal_id
    }))
  ];
  res.json(allOrders);
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
  if (!data.orders) data.orders = [];
  if (!data.customer_orders) data.customer_orders = [];
  
  const index = data.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Order not found' });
  
  data.orders[index] = {
    ...data.orders[index],
    ...req.body,
    id: req.params.id,
    updated_at: new Date().toISOString()
  };
  
  // Sync with customer portal orders if this is a customer portal order
  const customerOrderIndex = data.customer_orders.findIndex(co => co.id === req.params.id);
  if (customerOrderIndex !== -1) {
    data.customer_orders[customerOrderIndex] = {
      ...data.customer_orders[customerOrderIndex],
      ...req.body,
      id: req.params.id,
      updated_at: new Date().toISOString()
    };
  }
  
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
  // Search by both id and unique_url
  const portal = data.customer_portals?.find(p => 
    p.id === req.params.id || p.unique_url === req.params.id
  );
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
  // Search by both id and unique_url
  const index = data.customer_portals.findIndex(p => 
    p.id === req.params.id || p.unique_url === req.params.id
  );
  if (index === -1) return res.status(404).json({ message: 'Customer portal not found' });
  
  data.customer_portals[index] = {
    ...data.customer_portals[index],
    ...req.body,
    id: data.customer_portals[index].id, // Keep original ID
    updated_at: new Date().toISOString()
  };
  writeData(data);
  res.json(data.customer_portals[index]);
});

app.delete('/api/customer-portals/:id', (req, res) => {
  const data = readData();
  if (!data.customer_portals) data.customer_portals = [];
  // Search by both id and unique_url
  const index = data.customer_portals.findIndex(p => 
    p.id === req.params.id || p.unique_url === req.params.id
  );
  if (index === -1) return res.status(404).json({ message: 'Customer portal not found' });
  
  data.customer_portals.splice(index, 1);
  writeData(data);
  res.json({ message: 'Customer portal deleted' });
});

// CUSTOMER PORTAL ORDERS API
app.get('/api/customer-portals/:portalId/orders', (req, res) => {
  const data = readData();
  if (!data.customer_orders) data.customer_orders = [];
  const portalOrders = data.customer_orders.filter(order => order.portal_id === req.params.portalId);
  res.json(portalOrders);
});

app.post('/api/customer-portals/:portalId/orders', (req, res) => {
  const data = readData();
  if (!data.customer_orders) data.customer_orders = [];
  if (!data.orders) data.orders = [];
  if (!data.customer_portals) data.customer_portals = [];
  
  const order = {
    ...req.body,
    id: req.body.id || generateId(),
    portal_id: req.params.portalId,
    status: req.body.status || 'pending', // Default status
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Add to customer orders
  data.customer_orders.push(order);
  
  // Create or update customer record
  if (!data.customers) data.customers = [];
  const existingCustomer = data.customers.find(c => 
    c.email === order.customer_email || 
    (c.name === order.customer_name && c.phone === order.customer_phone)
  );
  
  let customerId = req.params.portalId; // Default to portal ID
  
  if (!existingCustomer) {
    // Create new customer record
    const newCustomer = {
      id: generateId(),
      name: order.customer_name || 'Customer Portal Customer',
      email: order.customer_email || '',
      phone: order.customer_phone || '',
      address: order.delivery_address || '',
      customer_type: 'retail',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'customer-portal',
      portal_id: req.params.portalId
    };
    data.customers.push(newCustomer);
    customerId = newCustomer.id;
    console.log(`✅ Created new customer record: ${newCustomer.name}`);
  } else {
    // Update existing customer with latest info
    existingCustomer.address = order.delivery_address || existingCustomer.address;
    existingCustomer.phone = order.customer_phone || existingCustomer.phone;
    existingCustomer.updated_at = new Date().toISOString();
    customerId = existingCustomer.id;
    console.log(`✅ Updated existing customer: ${existingCustomer.name}`);
  }
  
  // Sync with main order system
  const mainOrder = {
    id: order.id,
    order_number: order.order_number || `CP-${order.id}`,
    customer_id: customerId, // Use actual customer ID
    customer_name: order.customer_name || 'Customer Portal Order',
    total_amount: order.total_amount || 0,
    status: order.status,
    order_date: order.order_date || order.created_at,
    delivery_date: order.delivery_date,
    items: order.items || [],
    notes: order.notes || `Customer Portal Order - ${order.customer_name}`,
    created_by: 'customer-portal',
    source: 'customer-portal', // Mark as customer portal order
    portal_id: req.params.portalId,
    created_at: order.created_at,
    updated_at: order.updated_at
  };
  
  data.orders.push(mainOrder);
  console.log(`✅ Main order created with ID: ${mainOrder.id}`);
  console.log(`📊 Total main orders: ${data.orders.length}`);
  
  // Update product stock quantities
  if (order.items && order.items.length > 0) {
    let stockUpdateCount = 0;
    for (const item of order.items) {
      try {
        const product = data.products.find(p => p.id === item.product_id);
        if (product) {
          const currentStock = product.stock_quantity || 0;
          const newStockQuantity = Math.max(0, currentStock - item.quantity);
          
          console.log(`📦 Updating stock for ${product.product_name || product.name}: ${currentStock} -> ${newStockQuantity} (ordered: ${item.quantity})`);
          
          product.stock_quantity = newStockQuantity;
          product.updated_at = new Date().toISOString();
          stockUpdateCount++;
        }
      } catch (stockError) {
        console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
      }
    }
    console.log(`✅ Stock updated for ${stockUpdateCount} products in customer portal order`);
  }
  
  // Update customer portal statistics
  const portal = data.customer_portals.find(p => 
    p.id === req.params.portalId || p.unique_url === req.params.portalId
  );
  if (portal) {
    portal.total_orders = (portal.total_orders || 0) + 1;
    portal.total_amount = (portal.total_amount || 0) + (order.total_amount || 0);
    portal.updated_at = new Date().toISOString();
  }
  
  writeData(data);
  res.json(order);
});

app.get('/api/customer-portals/:portalId/orders/:orderId', (req, res) => {
  const data = readData();
  if (!data.customer_orders) data.customer_orders = [];
  const order = data.customer_orders.find(o => 
    o.id === req.params.orderId && o.portal_id === req.params.portalId
  );
  if (!order) return res.status(404).json({ message: 'Customer order not found' });
  res.json(order);
});

app.put('/api/customer-portals/:portalId/orders/:orderId', (req, res) => {
  const data = readData();
  if (!data.customer_orders) data.customer_orders = [];
  if (!data.orders) data.orders = [];
  if (!data.customer_portals) data.customer_portals = [];
  
  const index = data.customer_orders.findIndex(o => 
    o.id === req.params.orderId && o.portal_id === req.params.portalId
  );
  if (index === -1) return res.status(404).json({ message: 'Customer order not found' });
  
  const oldOrder = data.customer_orders[index];
  data.customer_orders[index] = {
    ...data.customer_orders[index],
    ...req.body,
    id: req.params.orderId,
    portal_id: req.params.portalId,
    updated_at: new Date().toISOString()
  };
  
  // Sync with main order system
  const mainOrderIndex = data.orders.findIndex(o => o.id === req.params.orderId);
  if (mainOrderIndex !== -1) {
    data.orders[mainOrderIndex] = {
      ...data.orders[mainOrderIndex],
      ...req.body,
      id: req.params.orderId,
      customer_id: req.params.portalId,
      customer_name: req.body.customer_name || data.orders[mainOrderIndex].customer_name,
      total_amount: req.body.total_amount || data.orders[mainOrderIndex].total_amount,
      status: req.body.status || data.orders[mainOrderIndex].status,
      items: req.body.items || data.orders[mainOrderIndex].items,
      notes: req.body.notes || data.orders[mainOrderIndex].notes,
      updated_at: new Date().toISOString()
    };
  }
  
  // Update customer portal statistics if amount changed
  const portal = data.customer_portals.find(p => 
    p.id === req.params.portalId || p.unique_url === req.params.portalId
  );
  if (portal && req.body.total_amount !== undefined) {
    const amountDiff = (req.body.total_amount || 0) - (oldOrder.total_amount || 0);
    portal.total_amount = (portal.total_amount || 0) + amountDiff;
    portal.updated_at = new Date().toISOString();
  }
  
  writeData(data);
  res.json(data.customer_orders[index]);
});

app.delete('/api/customer-portals/:portalId/orders/:orderId', (req, res) => {
  const data = readData();
  if (!data.customer_orders) data.customer_orders = [];
  if (!data.orders) data.orders = [];
  if (!data.customer_portals) data.customer_portals = [];
  
  const index = data.customer_orders.findIndex(o => 
    o.id === req.params.orderId && o.portal_id === req.params.portalId
  );
  if (index === -1) return res.status(404).json({ message: 'Customer order not found' });
  
  const deletedOrder = data.customer_orders[index];
  
  // Remove from customer orders
  data.customer_orders.splice(index, 1);
  
  // Remove from main order system
  const mainOrderIndex = data.orders.findIndex(o => o.id === req.params.orderId);
  if (mainOrderIndex !== -1) {
    data.orders.splice(mainOrderIndex, 1);
  }
  
  // Restore product stock quantities
  if (deletedOrder.items && deletedOrder.items.length > 0) {
    let stockRestoreCount = 0;
    for (const item of deletedOrder.items) {
      try {
        const product = data.products.find(p => p.id === item.product_id);
        if (product) {
          const currentStock = product.stock_quantity || 0;
          const newStockQuantity = currentStock + item.quantity;
          
          console.log(`📦 Restoring stock for ${product.product_name || product.name}: ${currentStock} -> ${newStockQuantity} (restored: ${item.quantity})`);
          
          product.stock_quantity = newStockQuantity;
          product.updated_at = new Date().toISOString();
          stockRestoreCount++;
        }
      } catch (stockError) {
        console.error(`Failed to restore stock for product ${item.product_id}:`, stockError);
      }
    }
    console.log(`✅ Stock restored for ${stockRestoreCount} products in customer portal order deletion`);
  }
  
  // Update customer portal statistics
  const portal = data.customer_portals.find(p => 
    p.id === req.params.portalId || p.unique_url === req.params.portalId
  );
  if (portal) {
    portal.total_orders = Math.max(0, (portal.total_orders || 0) - 1);
    portal.total_amount = Math.max(0, (portal.total_amount || 0) - (deletedOrder.total_amount || 0));
    portal.updated_at = new Date().toISOString();
  }
  
  writeData(data);
  res.json({ message: 'Customer order deleted' });
});

// Update order status specifically (with sync)
app.patch('/api/orders/:id/status', (req, res) => {
  const data = readData();
  if (!data.orders) data.orders = [];
  if (!data.customer_orders) data.customer_orders = [];
  
  console.log(`🔍 Looking for order ID: ${req.params.id}`);
  console.log(`📊 Main orders count: ${data.orders.length}`);
  console.log(`📊 Customer orders count: ${data.customer_orders.length}`);
  
  const index = data.orders.findIndex(o => o.id === req.params.id);
  console.log(`🔍 Main order index: ${index}`);
  
  if (index === -1) {
    console.log(`❌ Order ${req.params.id} not found in main orders`);
    console.log(`📋 Available main order IDs:`, data.orders.map(o => o.id));
    return res.status(404).json({ message: 'Order not found' });
  }
  
  const newStatus = req.body.status;
  if (!newStatus) return res.status(400).json({ message: 'Status is required' });
  
  console.log(`🔄 Updating order ${req.params.id} status: ${data.orders[index].status} → ${newStatus}`);
  
  // Update main order
  data.orders[index] = {
    ...data.orders[index],
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  
  // Sync with customer portal orders if this is a customer portal order
  const customerOrderIndex = data.customer_orders.findIndex(co => co.id === req.params.id);
  console.log(`🔍 Customer order index: ${customerOrderIndex}`);
  
  if (customerOrderIndex !== -1) {
    console.log(`🔄 Syncing with customer portal order ${req.params.id}`);
    data.customer_orders[customerOrderIndex] = {
      ...data.customer_orders[customerOrderIndex],
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    console.log(`✅ Customer portal order synced: ${newStatus}`);
  } else {
    console.log(`ℹ️ Order ${req.params.id} not found in customer_orders (not a customer portal order)`);
    console.log(`📋 Available customer order IDs:`, data.customer_orders.map(co => co.id));
  }
  
  writeData(data);
  res.json(data.orders[index]);
});

// Update customer portal order status specifically (with sync)
app.patch('/api/customer-portals/:portalId/orders/:orderId/status', (req, res) => {
  const data = readData();
  if (!data.customer_orders) data.customer_orders = [];
  if (!data.orders) data.orders = [];
  
  const index = data.customer_orders.findIndex(o => 
    o.id === req.params.orderId && o.portal_id === req.params.portalId
  );
  if (index === -1) return res.status(404).json({ message: 'Customer order not found' });
  
  const newStatus = req.body.status;
  if (!newStatus) return res.status(400).json({ message: 'Status is required' });
  
  // Update customer portal order
  data.customer_orders[index] = {
    ...data.customer_orders[index],
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  
  // Sync with main order system
  const mainOrderIndex = data.orders.findIndex(o => o.id === req.params.orderId);
  if (mainOrderIndex !== -1) {
    data.orders[mainOrderIndex] = {
      ...data.orders[mainOrderIndex],
      status: newStatus,
      updated_at: new Date().toISOString()
    };
  }
  
  writeData(data);
  res.json(data.customer_orders[index]);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HERB Backend API is running - Customer Portal Order endpoints available - Icon fix deployed - Sync enabled - Status sync enabled - Customer sync enabled - Real-time sync active' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HERB Backend API running on port ${PORT}`);
  console.log(`📁 Data file: ${dataFile}`);
});
