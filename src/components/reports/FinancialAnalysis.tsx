import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Package } from 'lucide-react';

interface FinancialAnalysisProps {
  orders: any[];
  products: any[];
  dateRange: string;
}

export const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({ orders, products, dateRange }) => {
  // Calculate profit metrics
  let totalRevenue = 0;
  let totalCost = 0;

  orders.forEach((order: any) => {
    totalRevenue += order.total_amount || 0;
    
    if (order.items) {
      order.items.forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.product_id);
        totalCost += (product?.cost_price || 0) * (item.quantity || 0);
      });
    }
  });

  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Product profitability
  const productProfits: Record<string, any> = {};
  
  orders.forEach((order: any) => {
    if (!order.items) return;
    
    order.items.forEach((item: any) => {
      const product = products.find((p: any) => p.id === item.product_id);
      if (!product) return;
      
      const revenue = item.total_price || 0;
      const cost = product.cost_price * (item.quantity || 0);
      const profit = revenue - cost;
      
      if (!productProfits[item.product_id]) {
        productProfits[item.product_id] = {
          productId: item.product_id,
          productName: item.product_name || product.product_name,
          category: product.category,
          totalProfit: 0,
          totalRevenue: 0
        };
      }
      productProfits[item.product_id].totalProfit += profit;
      productProfits[item.product_id].totalRevenue += revenue;
    });
  });

  // Get most profitable products
  const mostProfitableProducts = Object.values(productProfits)
    .sort((a: any, b: any) => b.totalProfit - a.totalProfit)
    .slice(0, 10);

  // Profitability by category
  const categoryProfits: Record<string, number> = {};
  Object.values(productProfits).forEach((product: any) => {
    const category = product.category || 'other';
    categoryProfits[category] = (categoryProfits[category] || 0) + product.totalProfit;
  });

  const categoryConfig: Record<string, { label: string; color: string }> = {
    liquor: { label: 'Liquor', color: 'bg-amber-100 text-amber-800' },
    beer: { label: 'Beer', color: 'bg-yellow-100 text-yellow-800' },
    wine: { label: 'Wine', color: 'bg-red-100 text-red-800' },
    spirits: { label: 'Spirits', color: 'bg-purple-100 text-purple-800' },
    other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
  };

  const categoryData = Object.entries(categoryProfits)
    .map(([category, profit]) => ({
      category,
      profit,
      ...categoryConfig[category] || categoryConfig.other
    }))
    .sort((a, b) => b.profit - a.profit);

  const totalProfitFromProducts = Object.values(productProfits).reduce((sum: number, p: any) => sum + p.totalProfit, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs. {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">From all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rs. {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Product costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs. {totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Net profit/loss</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Margin percentage</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Cost Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Cost Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">Revenue</span>
                <span className="text-sm font-bold">Rs. {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: '100%' }}
                >
                  <span className="text-xs text-white font-bold">100%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-red-700">Cost</span>
                <span className="text-sm font-bold">Rs. {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-red-600 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: totalRevenue > 0 ? `${(totalCost / totalRevenue) * 100}%` : '0%' }}
                >
                  <span className="text-xs text-white font-bold">
                    {totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Profit</span>
                <span className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {Math.abs(totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {totalProfit > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div 
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${profitMargin}%` }}
                  >
                    <span className="text-xs text-white font-bold">{profitMargin.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Profitable Products */}
        <Card>
          <CardHeader>
            <CardTitle>Most Profitable Products (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {mostProfitableProducts.length > 0 ? (
              <div className="space-y-3">
                {mostProfitableProducts.map((product: any, index: number) => {
                  const margin = product.totalRevenue > 0 ? (product.totalProfit / product.totalRevenue) * 100 : 0;
                  return (
                    <div key={product.productId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{product.productName}</p>
                          <p className="text-xs text-gray-500">Margin: {margin.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${product.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Rs. {product.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No profitability data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profitability by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Profitability by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                {categoryData.map((item) => {
                  const margin = categoryProfits[item.category] / totalProfitFromProducts * 100;
                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={item.color}>
                          {item.label}
                        </Badge>
                        <span className={`font-bold text-sm ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Rs. {item.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-600 h-2 rounded-full" 
                            style={{ width: `${Math.abs(margin)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{margin.toFixed(1)}%</span>
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
    </div>
  );
};
