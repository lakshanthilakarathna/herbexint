/**
 * Stock Synchronization Utility
 * Helps fix stock calculation issues and provides debugging tools
 */

export interface StockOperation {
  productId: string;
  operation: 'create' | 'delete' | 'edit' | 'restore';
  quantity: number;
  timestamp: string;
  orderId?: string;
}

export class StockSynchronizer {
  private static instance: StockSynchronizer;
  private operations: StockOperation[] = [];

  private constructor() {}

  public static getInstance(): StockSynchronizer {
    if (!StockSynchronizer.instance) {
      StockSynchronizer.instance = new StockSynchronizer();
    }
    return StockSynchronizer.instance;
  }

  /**
   * Log a stock operation for debugging
   */
  public logOperation(operation: StockOperation): void {
    this.operations.push(operation);
    console.log(`📊 Stock Operation: ${operation.operation} - Product ${operation.productId} - Qty: ${operation.quantity > 0 ? '+' : ''}${operation.quantity}`);
  }

  /**
   * Get all operations for a specific product
   */
  public getProductOperations(productId: string): StockOperation[] {
    return this.operations.filter(op => op.productId === productId);
  }

  /**
   * Calculate expected stock based on operations
   */
  public calculateExpectedStock(productId: string, initialStock: number = 0): number {
    const operations = this.getProductOperations(productId);
    return operations.reduce((stock, op) => {
      switch (op.operation) {
        case 'create':
        case 'edit':
          return stock - op.quantity;
        case 'delete':
        case 'restore':
          return stock + op.quantity;
        default:
          return stock;
      }
    }, initialStock);
  }

  /**
   * Clear operations history
   */
  public clearHistory(): void {
    this.operations = [];
  }

  /**
   * Get all operations
   */
  public getAllOperations(): StockOperation[] {
    return [...this.operations];
  }

  /**
   * Validate stock consistency
   */
  public validateStock(productId: string, currentStock: number, initialStock: number = 0): {
    isValid: boolean;
    expectedStock: number;
    difference: number;
    operations: StockOperation[];
  } {
    const operations = this.getProductOperations(productId);
    const expectedStock = this.calculateExpectedStock(productId, initialStock);
    const difference = currentStock - expectedStock;
    
    return {
      isValid: Math.abs(difference) < 0.01, // Allow for small floating point differences
      expectedStock,
      difference,
      operations
    };
  }
}

// Export singleton instance
export const stockSynchronizer = StockSynchronizer.getInstance();

// Helper functions
export const logStockOperation = (operation: StockOperation) => 
  stockSynchronizer.logOperation(operation);

export const validateProductStock = (productId: string, currentStock: number, initialStock: number = 0) =>
  stockSynchronizer.validateStock(productId, currentStock, initialStock);
