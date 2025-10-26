// Real API Client - connects to Node.js backend on EC2

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : '/api';

class APIClient {
  // Helper method for API requests
  private async request(url: string, options: RequestInit = {}): Promise<any> {
    // Add cache busting for GET requests
    const timestamp = new Date().getTime();
    const cacheBuster = url.includes('?') ? `&_t=${timestamp}` : `?_t=${timestamp}`;
    const getUrl = options.method === 'GET' ? `${url}${cacheBuster}` : url;
    
    const response = await fetch(`${API_BASE_URL}${getUrl}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Products
  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(product: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers
  async getCustomers() {
    return this.request('/customers');
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(customer: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, updates: any) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(order: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async updateOrder(id: string, updates: any) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteOrder(id: string) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async createUser(user: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, updates: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async upsertUser(user: any) {
    if (user.id) {
      return this.updateUser(user.id, user);
    } else {
      return this.createUser(user);
    }
  }


  // Visits
  async getVisits() {
    return this.request('/visits');
  }

  async getVisit(id: string) {
    return this.request(`/visits/${id}`);
  }

  async createVisit(visit: any) {
    return this.request('/visits', {
      method: 'POST',
      body: JSON.stringify(visit),
    });
  }

  async updateVisit(id: string, updates: any) {
    return this.request(`/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteVisit(id: string) {
    return this.request(`/visits/${id}`, {
      method: 'DELETE',
    });
  }

  // System Logs
  async getLogs() {
    return this.request('/logs');
  }

  async createLog(log: any) {
    return this.request('/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }
}

export const apiClient = new APIClient();

