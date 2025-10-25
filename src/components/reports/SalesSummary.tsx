import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, TrendingUpIcon } from 'lucide-react';

interface SalesSummaryProps {
  orders: any[];
  dateRange: string;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({ orders, dateRange }) => {
  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
  const totalProductsSold = orders.reduce((sum, order) => {
    if (!order.items) return sum;
    return sum + order.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
  }, 0);

  // Calculate previous period for comparison (placeholder)
  const prevPeriodRevenue = totalRevenue * 0.85; // Mock comparison
  const percentageChange = prevPeriodRevenue > 0 
    ? ((totalRevenue - prevPeriodRevenue) / prevPeriodRevenue * 100).toFixed(1)
    : 0;
  const isPositive = totalRevenue > prevPeriodRevenue;

  // Prepare data for daily trend chart (simple representation)
  const dailySales = orders.reduce((acc: any, order: any) => {
    const date = new Date(order.created_at).toDateString();
    acc[date] = (acc[date] || 0) + (order.total_amount || 0);
    return acc;
  }, {});

  const chartData = Object.entries(dailySales).map(([date, amount]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: amount as number
  })).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="flex items-center text-xs mt-1">
              {isPositive ? (
                <Badge variant="default" className="bg-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {percentageChange}%
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {Math.abs(Number(percentageChange))}%
                </Badge>
              )}
              <span className="ml-2 text-gray-500">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <p className="text-xs text-gray-500 mt-1">Orders in {dateRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 mt-1">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductsSold.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Units sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-4">
              {/* Simple bar chart representation */}
              <div className="flex items-end justify-between h-48 gap-1">
                {chartData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="bg-amber-600 rounded-t w-full relative group"
                      style={{ 
                        height: `${(item.amount / Math.max(...chartData.map(d => d.amount))) * 100}%`,
                        minHeight: '4px'
                      }}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Rs. {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 rotate-45 origin-left whitespace-nowrap">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sales data for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order, index) => (
                <div key={order.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.order_number || order.id?.substring(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Rs. {order.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No orders found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
