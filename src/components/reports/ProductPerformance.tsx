import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Package, TrendingDown, AlertCircle } from 'lucide-react';

interface ProductPerformanceProps {
  orders: any[];
  products: any[];
  dateRange: string;
}

export const ProductPerformance: React.FC<ProductPerformanceProps> = ({ orders, products, dateRange }) => {
  // Aggregate product sales from orders
  const productSales: Record<string, any> = {};
  
  orders.forEach(order => {
    if (!order.items) return;
    
    order.items.forEach((item: any) => {
      const productId = item.product_id || item.product_name;
      
      if (!productSales[productId]) {
        productSales[productId] = {
          productId,
          name: item.product_name || 'Unknown',
          quantity: 0,
          revenue: 0,
          ordersCount: 0
        };
      }
      
      productSales[productId].quantity += item.quantity || 0;
      productSales[productId].revenue += item.total_price || 0;
      productSales[productId].ordersCount += 1;
    });
  });

  // Sort and get top 10
  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);

  // Calculate revenue by category
  const categoryRevenue: Record<string, number> = {};
  Object.values(productSales).forEach((product: any) => {
    const productDetails = products.find(p => p.id === product.productId || p.product_name === product.name);
    const category = productDetails?.category || 'other';
    categoryRevenue[category] = (categoryRevenue[category] || 0) + product.revenue;
  });

  // Get category display info
  const categoryConfig: Record<string, { color: string; label: string }> = {
    liquor: { color: 'bg-amber-100 text-amber-800', label: 'Liquor' },
    beer: { color: 'bg-yellow-100 text-yellow-800', label: 'Beer' },
    wine: { color: 'bg-red-100 text-red-800', label: 'Wine' },
    spirits: { color: 'bg-purple-100 text-purple-800', label: 'Spirits' },
    other: { color: 'bg-gray-100 text-gray-800', label: 'Other' }
  };

  const categoryData = Object.entries(categoryRevenue)
    .map(([category, revenue]) => ({
      category,
      revenue,
      ...categoryConfig[category] || categoryConfig.other
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Find slow-moving products (products with < 5 units sold in period)
  const slowMovingProducts = Object.values(productSales)
    .filter((product: any) => product.quantity < 5)
    .sort((a: any, b: any) => a.quantity - b.quantity)
    .slice(0, 5);

  const totalRevenue = Object.values(productSales).reduce((sum: number, product: any) => sum + product.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products Sold</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(productSales).length}</div>
            <p className="text-xs text-gray-500 mt-1">Unique products in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Trophy className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 mt-1">From product sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue per Product</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {(totalRevenue / Object.keys(productSales).length || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all products</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product: any, index: number) => {
                  const percentage = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={product.productId || index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                        <span className="font-bold text-sm">
                          Rs. {product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span>{product.quantity} units</span>
                        <span>{product.ordersCount} orders</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No product sales data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                {categoryData.map((item, index) => {
                  const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={item.color}>
                          {item.label}
                        </Badge>
                        <span className="font-bold text-sm">
                          Rs. {item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No category data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slow-Moving Products Alert */}
      {slowMovingProducts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Slow-Moving Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              These products have low sales velocity (&lt; 5 units in this period):
            </p>
            <div className="space-y-2">
              {slowMovingProducts.map((product: any, index: number) => (
                <div key={product.productId || index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium">{product.name}</span>
                  <Badge variant="secondary">
                    {product.quantity} units
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};