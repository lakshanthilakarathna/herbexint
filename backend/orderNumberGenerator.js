/**
 * Backend Order Number Generation Utility
 * Ensures unique order numbers across all order types
 */

class BackendOrderNumberGenerator {
  constructor() {
    this.counters = new Map();
  }

  /**
   * Generate unique order number based on type and user
   */
  generateOrderNumber(config) {
    const date = config.date || new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    let key;
    let prefix;

    switch (config.prefix) {
      case 'admin':
        prefix = 'ADM';
        key = `admin-${dateStr}`;
        break;
      case 'sales-rep':
        if (!config.userId) {
          throw new Error('Sales Rep ID is required for sales rep orders');
        }
        prefix = `SRP-${config.userId.slice(-4)}`; // Last 4 chars of user ID
        key = `srp-${config.userId}-${dateStr}`;
        break;
      case 'customer-portal':
        prefix = 'CPO';
        key = `cpo-${dateStr}`;
        break;
      default:
        throw new Error(`Unknown order prefix: ${config.prefix}`);
    }

    // Get or initialize counter for this key
    const currentCount = this.counters.get(key) || 0;
    const newCount = currentCount + 1;
    this.counters.set(key, newCount);

    // Format: PREFIX-YYYYMMDD-001
    const sequence = String(newCount).padStart(3, '0');
    return `${prefix}-${dateStr}-${sequence}`;
  }

  /**
   * Generate order number for admin orders
   */
  generateAdminOrderNumber(date) {
    return this.generateOrderNumber({ prefix: 'admin', date });
  }

  /**
   * Generate order number for sales rep orders
   */
  generateSalesRepOrderNumber(userId, date) {
    return this.generateOrderNumber({ prefix: 'sales-rep', userId, date });
  }

  /**
   * Generate order number for customer portal orders
   */
  generateCustomerPortalOrderNumber(date) {
    return this.generateOrderNumber({ prefix: 'customer-portal', date });
  }

  /**
   * Reset counters (useful for testing)
   */
  resetCounters() {
    this.counters.clear();
  }

  /**
   * Get current counter for a specific key
   */
  getCounter(key) {
    return this.counters.get(key) || 0;
  }
}

// Create singleton instance
const orderNumberGenerator = new BackendOrderNumberGenerator();

module.exports = {
  orderNumberGenerator,
  generateAdminOrderNumber: (date) => orderNumberGenerator.generateAdminOrderNumber(date),
  generateSalesRepOrderNumber: (userId, date) => orderNumberGenerator.generateSalesRepOrderNumber(userId, date),
  generateCustomerPortalOrderNumber: (date) => orderNumberGenerator.generateCustomerPortalOrderNumber(date)
};
