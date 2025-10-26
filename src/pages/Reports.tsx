import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Download, Filter } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { SalesSummary } from '@/components/reports/SalesSummary';
import { ProductPerformance } from '@/components/reports/ProductPerformance';
import { StockStatus } from '@/components/reports/StockStatus';
import { SalesRepPerformance } from '@/components/reports/SalesRepPerformance';
import { CustomerAnalytics } from '@/components/reports/CustomerAnalytics';
import { FinancialAnalysis } from '@/components/reports/FinancialAnalysis';

const Reports: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [dateRange, setDateRange] = useState<string>('week');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load data from API backend
      const ordersData = await apiClient.getOrders();
      const productsData = await apiClient.getProducts();
      const customersData = await apiClient.getCustomers();

      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: now };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      default:
        return { start: today, end: now };
    }
  };

  const filterOrdersByDateRange = (ordersList: any[]) => {
    const { start, end } = getDateRangeFilter();
    return ordersList.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">View detailed insights and performance metrics</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales">Sales Summary</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="stock">Stock Status</TabsTrigger>
          <TabsTrigger value="reps">Sales Rep Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="financial">Financial Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <SalesSummary 
            orders={filterOrdersByDateRange(orders)} 
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductPerformance 
            orders={filterOrdersByDateRange(orders)} 
            products={products}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <StockStatus products={products} />
        </TabsContent>

        <TabsContent value="reps" className="space-y-4">
          <SalesRepPerformance 
            orders={filterOrdersByDateRange(orders)} 
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerAnalytics 
            orders={filterOrdersByDateRange(orders)} 
            customers={customers}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialAnalysis 
            orders={filterOrdersByDateRange(orders)} 
            products={products}
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
