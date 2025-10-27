/**
 * Order Number Generation Utility
 * Ensures unique order numbers across all order types
 */

export interface OrderNumberConfig {
  prefix: string;
  userId?: string;
  date?: Date;
}

export class OrderNumberGenerator {
  private static instance: OrderNumberGenerator;
  private counters: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): OrderNumberGenerator {
    if (!OrderNumberGenerator.instance) {
      OrderNumberGenerator.instance = new OrderNumberGenerator();
    }
    return OrderNumberGenerator.instance;
  }

  /**
   * Generate unique order number based on type and user
   */
  public generateOrderNumber(config: OrderNumberConfig): string {
    const date = config.date || new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    let key: string;
    let prefix: string;

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
  public generateAdminOrderNumber(date?: Date): string {
    return this.generateOrderNumber({ prefix: 'admin', date });
  }

  /**
   * Generate order number for sales rep orders
   */
  public generateSalesRepOrderNumber(userId: string, date?: Date): string {
    return this.generateOrderNumber({ prefix: 'sales-rep', userId, date });
  }

  /**
   * Generate order number for customer portal orders
   */
  public generateCustomerPortalOrderNumber(date?: Date): string {
    return this.generateOrderNumber({ prefix: 'customer-portal', date });
  }

  /**
   * Reset counters (useful for testing)
   */
  public resetCounters(): void {
    this.counters.clear();
  }

  /**
   * Get current counter for a specific key
   */
  public getCounter(key: string): number {
    return this.counters.get(key) || 0;
  }
}

// Export singleton instance
export const orderNumberGenerator = OrderNumberGenerator.getInstance();

// Helper functions for easy use
export const generateAdminOrderNumber = (date?: Date) => 
  orderNumberGenerator.generateAdminOrderNumber(date);

export const generateSalesRepOrderNumber = (userId: string, date?: Date) => 
  orderNumberGenerator.generateSalesRepOrderNumber(userId, date);

export const generateCustomerPortalOrderNumber = (date?: Date) => 
  orderNumberGenerator.generateCustomerPortalOrderNumber(date);
