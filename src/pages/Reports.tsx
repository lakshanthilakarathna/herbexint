import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Download, Filter } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { SalesSummary } from '@/components/reports/SalesSummary';
import { SalesRepPerformance } from '@/components/reports/SalesRepPerformance';
import { CustomerAnalytics } from '@/components/reports/CustomerAnalytics';

const Reports: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [dateRange, setDateRange] = useState<string>('week');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load data from API backend - temporarily use getOrders until backend is updated
      const ordersData = await apiClient.getOrders();
      const productsData = await apiClient.getProducts();
      const customersData = await apiClient.getCustomers();
      const usersData = await apiClient.getUsers();

      console.log('Reports Debug:', {
        ordersCount: ordersData.length,
        productsCount: productsData.length,
        customersCount: customersData.length,
        usersCount: usersData.length,
        orderCreatedBy: ordersData.map(o => o.created_by)
      });

      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
      setUsers(usersData);
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
    let filtered = ordersList.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
    
    // Filter by selected sales rep
    if (selectedRep !== 'all') {
      filtered = filtered.filter(order => {
        // Check both created_by field and any user ID matching
        return order.created_by === selectedRep || order.user_id === selectedRep;
      });
    }
    
    return filtered;
  };
  
  // Get sales reps (users with sales rep role)
  const getSalesReps = () => {
    const salesReps = users.filter(u => u.role_name === 'Sales Representative' || u.role_id === 'sales-rep-role-id');
    console.log('Sales Reps Debug:', {
      allUsers: users.map(u => ({ id: u.id, name: u.name, role_id: u.role_id, role_name: u.role_name })),
      salesReps: salesReps.map(r => ({ id: r.id, name: r.name }))
    });
    return salesReps;
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
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
            {selectedRep !== 'all' && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                - {getSalesReps().find(r => r.id === selectedRep)?.name || 'Selected Rep'}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600 mt-1">View detailed insights and performance metrics</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
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
          
          {/* Sales Rep Filter */}
          <Select value={selectedRep} onValueChange={setSelectedRep}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Sales Reps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sales Reps</SelectItem>
              {getSalesReps().map(rep => (
                <SelectItem key={rep.id} value={rep.id}>
                  {rep.name || rep.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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
          <TabsTrigger value="reps">Sales Rep Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <SalesSummary 
            orders={filterOrdersByDateRange(orders)} 
            dateRange={dateRange}
          />
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
      </Tabs>
    </div>
  );
};

export default Reports;
