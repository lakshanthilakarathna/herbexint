import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Building2, TrendingUp, Award } from 'lucide-react';

interface CustomerAnalyticsProps {
  orders: any[];
  customers: any[];
  dateRange: string;
}

export const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ orders, customers, dateRange }) => {
  // Aggregate by customer
  const customerSales: Record<string, any> = {};
  
  orders.forEach((order: any) => {
    if (!customerSales[order.customer_id]) {
      const customer = customers.find((c: any) => c.id === order.customer_id);
      customerSales[order.customer_id] = {
        customerId: order.customer_id,
        customerName: order.customer_name || customer?.name || 'Unknown',
        customerType: customer?.type || 'other',
        totalRevenue: 0,
        orderCount: 0
      };
    }
    customerSales[order.customer_id].totalRevenue += order.total_amount || 0;
    customerSales[order.customer_id].orderCount += 1;
  });

  // Get top customers
  const topCustomers = Object.values(customerSales)
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Revenue by customer type
  const typeRevenue: Record<string, number> = { bar: 0, restaurant: 0, liquor_store: 0, other: 0 };
  Object.values(customerSales).forEach((cs: any) => {
    typeRevenue[cs.customerType] = (typeRevenue[cs.customerType] || 0) + cs.totalRevenue;
  });

  const totalRevenue = Object.values(customerSales).reduce((sum: number, cs: any) => sum + cs.totalRevenue, 0);

  const typeConfig: Record<string, { label: string; color: string }> = {
    bar: { label: 'Bar', color: 'bg-blue-100 text-blue-800' },
    restaurant: { label: 'Restaurant', color: 'bg-green-100 text-green-800' },
    liquor_store: { label: 'Liquor Store', color: 'bg-purple-100 text-purple-800' },
    other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
  };

  const typeData = Object.entries(typeRevenue)
    .map(([type, revenue]) => ({
      type,
      revenue,
      ...typeConfig[type] || typeConfig.other
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .filter(item => item.revenue > 0);

  // Calculate average order value per customer
  const avgOrderValue = Object.values(customerSales).reduce((sum: number, cs: any) => {
    return sum + (cs.totalRevenue / (cs.orderCount || 1));
  }, 0) / Object.keys(customerSales).length || 0;

  // Get customer count
  const customerCount = Object.keys(customerSales).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active customers in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customer Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 mt-1">From all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 mt-1">Per customer</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <div className="space-y-4">
                {topCustomers.map((customer: any, index: number) => {
                  const percentage = totalRevenue > 0 ? (customer.totalRevenue / totalRevenue) * 100 : 0;
                  const safePercentage = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0;
                  return (
                    <div key={customer.customerId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium text-sm">{customer.customerName}</span>
                        </div>
                        <span className="font-bold text-sm">
                          Rs. {customer.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-600 h-2 rounded-full" 
                            style={{ width: `${safePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{safePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.orderCount} orders
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No customer data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Customer Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Customer Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="space-y-4">
                {typeData.map((item) => {
                  const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                  const safePercentage = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0;
                  return (
                    <div key={item.type} className="space-y-2">
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
                            style={{ width: `${safePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{safePercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No customer type data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Active Customer */}
      {topCustomers.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Best Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white rounded border border-amber-200">
              <div>
                <p className="font-bold text-lg">{topCustomers[0].customerName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={typeConfig[topCustomers[0].customerType]?.color}>
                    {typeConfig[topCustomers[0].customerType]?.label}
                  </Badge>
                  <span>{topCustomers[0].orderCount} orders</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl text-amber-600">
                  Rs. {topCustomers[0].totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  {totalRevenue > 0 ? ((topCustomers[0].totalRevenue / totalRevenue) * 100).toFixed(1) : 0}% of total revenue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
