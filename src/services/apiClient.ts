// Local Mock API Client - stores data in localStorage
// No AWS dependencies required

class APIClient {
  // Helper to get items from localStorage
  private getLocalStorage(key: string): any[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // Helper to save items to localStorage
  private setLocalStorage(key: string, data: any[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Products
  async getProducts() {
    console.log('Mock API: Getting products from localStorage');
    return this.getLocalStorage('products');
  }

  async getProduct(id: string) {
    const products = this.getLocalStorage('products');
    return products.find(p => p.id === id) || null;
  }

  async createProduct(product: any) {
    const products = this.getLocalStorage('products');
    const newProduct = {
      ...product,
      id: product.id || this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    products.push(newProduct);
    this.setLocalStorage('products', products);
    console.log('Mock API: Created product', newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: any) {
    const products = this.getLocalStorage('products');
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.setLocalStorage('products', products);
      console.log('Mock API: Updated product', products[index]);
      return products[index];
    }
    throw new Error('Product not found');
  }

  async deleteProduct(id: string) {
    const products = this.getLocalStorage('products');
    const filtered = products.filter(p => p.id !== id);
    this.setLocalStorage('products', filtered);
    console.log('Mock API: Deleted product', id);
  }

  // Customers
  async getCustomers() {
    console.log('Mock API: Getting customers from localStorage');
    return this.getLocalStorage('customers');
  }

  async getCustomer(id: string) {
    const customers = this.getLocalStorage('customers');
    return customers.find(c => c.id === id) || null;
  }

  async createCustomer(customer: any) {
    const customers = this.getLocalStorage('customers');
    const newCustomer = {
      ...customer,
      id: customer.id || this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    this.setLocalStorage('customers', customers);
    console.log('Mock API: Created customer', newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: any) {
    const customers = this.getLocalStorage('customers');
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.setLocalStorage('customers', customers);
      console.log('Mock API: Updated customer', customers[index]);
      return customers[index];
    }
    throw new Error('Customer not found');
  }

  async deleteCustomer(id: string) {
    const customers = this.getLocalStorage('customers');
    const filtered = customers.filter(c => c.id !== id);
    this.setLocalStorage('customers', filtered);
    console.log('Mock API: Deleted customer', id);
  }

  // Orders
  async getOrders() {
    console.log('Mock API: Getting orders from localStorage');
    return this.getLocalStorage('orders');
  }

  async getOrder(id: string) {
    const orders = this.getLocalStorage('orders');
    return orders.find(o => o.id === id) || null;
  }

  async createOrder(order: any) {
    const orders = this.getLocalStorage('orders');
    const newOrder = {
      ...order,
      id: order.id || this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    orders.push(newOrder);
    this.setLocalStorage('orders', orders);
    console.log('Mock API: Created order', newOrder);
    return newOrder;
  }

  async updateOrder(id: string, updates: any) {
    const orders = this.getLocalStorage('orders');
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.setLocalStorage('orders', orders);
      console.log('Mock API: Updated order', orders[index]);
      return orders[index];
    }
    throw new Error('Order not found');
  }

  async deleteOrder(id: string) {
    const orders = this.getLocalStorage('orders');
    const filtered = orders.filter(o => o.id !== id);
    this.setLocalStorage('orders', filtered);
    console.log('Mock API: Deleted order', id);
  }

  // Users
  async getUsers() {
    console.log('Mock API: Getting users from localStorage');
    return this.getLocalStorage('users');
  }

  async upsertUser(user: any) {
    const users = this.getLocalStorage('users');
    const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
    
    if (existingIndex !== -1) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...user,
        updated_at: new Date().toISOString()
      };
    } else {
      users.push({
        ...user,
        id: user.id || this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    this.setLocalStorage('users', users);
    console.log('Mock API: Upserted user', user);
    return user;
  }

  // Inventory
  async getInventory() {
    console.log('Mock API: Getting inventory from localStorage');
    const products = this.getLocalStorage('products');
    return products.map(p => ({
      product_id: p.id,
      product_name: p.product_name,
      current_stock: p.stock_quantity || 0,
      min_stock_level: p.min_stock_level || 10,
      max_stock_level: p.max_stock_level || 1000,
      unit: p.unit || 'pieces'
    }));
  }

  // Users
  async getUsers() {
    console.log('Mock API: Getting users from localStorage');
    return this.getLocalStorage('users');
  }

  async getUser(id: string) {
    const users = this.getLocalStorage('users');
    return users.find(u => u.id === id) || null;
  }

  async createUser(user: any) {
    const users = this.getLocalStorage('users');
    const newUser = {
      ...user,
      id: user.id || this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    users.push(newUser);
    this.setLocalStorage('users', users);
    console.log('Mock API: Created user', newUser);
    return newUser;
  }

  async updateUser(id: string, updates: any) {
    const users = this.getLocalStorage('users');
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.setLocalStorage('users', users);
      console.log('Mock API: Updated user', users[index]);
      return users[index];
    }
    throw new Error('User not found');
  }

  async deleteUser(id: string) {
    const users = this.getLocalStorage('users');
    const filtered = users.filter(u => u.id !== id);
    this.setLocalStorage('users', filtered);
    console.log('Mock API: Deleted user', id);
  }

  async upsertUser(user: any) {
    const users = this.getLocalStorage('users');
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...user,
        updated_at: new Date().toISOString()
      };
    } else {
      users.push({
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    this.setLocalStorage('users', users);
    console.log('Mock API: Upserted user', user);
    return user;
  }

  // System Logs
  async getLogs() {
    console.log('Mock API: Getting logs from localStorage');
    return this.getLocalStorage('system_logs');
  }

  async createLog(log: any) {
    const logs = this.getLocalStorage('system_logs');
    const newLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.setLocalStorage('system_logs', logs);
    return newLog;
  }
}

export const apiClient = new APIClient();

