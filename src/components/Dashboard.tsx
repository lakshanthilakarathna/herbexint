import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { apiClient } from '@/services/apiClient';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Settings, 
  FileText, 
  UserCheck, 
  Building2,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  topProducts: Array<{
    product_id: string;
    product_name: string;
    qty_sold: number;
    revenue: number;
  }>;
  outOfStockAlerts: number;
}

export const Dashboard: React.FC = () => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real data from API
      const [ordersResponse, productsResponse] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getProducts()
      ]);
      
      const allOrders = ordersResponse;
      const products = productsResponse;
      
      // Filter orders based on user role
      const isAdmin = user?.role_id === 'admin-role-id';
      const orders = isAdmin 
        ? allOrders  // Admin sees all orders
        : allOrders.filter((o: any) => o.created_by === user?.id);  // Sales Rep sees only their orders
      
      // Calculate statistics from filtered orders
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
      
      // Calculate top products from orders
      const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const key = item.product_id;
            if (!productSales[key]) {
              productSales[key] = { name: item.product_name || 'Unknown Product', qty: 0, revenue: 0 };
            }
            productSales[key].qty += item.quantity || 0;
            productSales[key].revenue += item.total_price || 0;
          });
        }
      });
      
      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({
          product_id: id,
          product_name: data.name,
          qty_sold: data.qty,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);
      
      // Calculate stock alerts (out of stock + low stock)
      const actualProducts = products.filter((p: any) => 
        p.category !== '__customer_portal__' && p.category !== '__shared_catalog__'
      );
      const outOfStockAlerts = actualProducts.filter((p: any) => {
        const stock = p.stock_quantity || 0;
        const minLevel = p.min_stock_level || 10;
        return stock === 0 || stock <= minLevel; // Out of stock OR low stock
      }).length;
      
      setStats({
        totalOrders,
        pendingOrders,
        totalRevenue,
        topProducts,
        outOfStockAlerts
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set empty stats on error
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        topProducts: [],
        outOfStockAlerts: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = (roleId: string) => {
    const roleMap: Record<string, string> = {
      'admin-role-id': 'System Administrator',
      'sales-manager-role-id': 'Sales Manager',
      'sales-rep-role-id': 'Sales Representative',
      'delivery-role-id': 'Delivery Personnel',
      'pharmacist-role-id': 'Distributor/Retailer',
      'inventory-role-id': 'Inventory Manager',
      'finance-role-id': 'Finance Manager',
      'auditor-role-id': 'Auditor'
    };
    return roleMap[roleId] || 'Unknown Role';
  };

  const getRoleBadgeVariant = (roleId: string) => {
    if (roleId === 'admin-role-id') return 'destructive';
    if (roleId === 'sales-manager-role-id') return 'default';
    if (roleId === 'sales-rep-role-id') return 'secondary';
    if (roleId === 'delivery-role-id') return 'outline';
    return 'outline';
  };

  const sidebarItems = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      href: '/dashboard',
      permission: null
    },
    {
      title: 'Orders',
      icon: ShoppingCart,
      href: '/orders',
      permission: 'orders:read'
    },
    {
      title: 'My Deliveries',
      icon: Package,
      href: '/deliveries',
      permission: 'deliveries:read'
    },
    {
      title: 'Customers',
      icon: Building2,
      href: '/customers',
      permission: 'customers:read'
    },
    {
      title: 'Products',
      icon: Package,
      href: '/products',
      permission: 'products:read'
    },
    {
      title: 'Visits',
      icon: UserCheck,
      href: '/visits',
      permission: 'visits:read'
    },
    {
      title: 'Reports',
      icon: FileText,
      href: '/reports',
      permission: 'reports:read'
    },
    {
      title: 'Users',
      icon: Users,
      href: '/users',
      permission: 'users:read'
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/settings',
      permission: 'settings:read'
    },
    {
      title: 'Logs',
      icon: FileText,
      href: '/logs',
      permission: 'audit:read'
    }
  ];

  const filteredSidebarItems = sidebarItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {filteredSidebarItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-200">
            <img 
              src="/herbexint.png" 
              alt="HERB" 
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-lg font-bold text-gray-900">HERB</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {filteredSidebarItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <Badge variant={getRoleBadgeVariant(user?.role_id || '')}>
                    {getRoleDisplayName(user?.role_id || '')}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome section */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-gray-600">
                {user?.role_id === 'admin-role-id' 
                  ? "Here's an overview of all liquor wholesale sales activity."
                  : "Here's an overview of your personal sales activity and orders."}
              </p>
              {user?.role_id !== 'admin-role-id' && (
                <p className="text-sm text-blue-600 mt-1">
                  📊 Showing your activity only
                </p>
              )}
            </div>
            <Button 
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                fetchDashboardStats();
              }}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {user?.role_id === 'admin-role-id' ? 'Total Orders' : 'My Orders'}
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats?.totalOrders.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalOrders === 0 ? 'No orders yet' : user?.role_id === 'admin-role-id' ? 'All orders' : 'Your orders'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {user?.role_id === 'admin-role-id' ? 'Pending Orders' : 'My Pending'}
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats?.pendingOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.role_id === 'admin-role-id' ? 'Requires attention' : 'Your pending orders'}
                </p>
              </CardContent>
            </Card>

            {/* Admin Only - Total Revenue */}
            {user?.role_id === 'admin-role-id' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : `Rs. ${stats?.totalRevenue.toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalRevenue === 0 ? 'No revenue yet' : 'Total revenue'}
                </p>
                </CardContent>
              </Card>
            )}

            {/* Admin Only - Stock Alerts */}
            {user?.role_id === 'admin-role-id' && (
              <Card className={stats?.outOfStockAlerts && stats.outOfStockAlerts > 0 ? 'border-yellow-300' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats?.outOfStockAlerts && stats.outOfStockAlerts > 0 ? 'text-yellow-600' : ''}`}>
                    {isLoading ? '...' : stats?.outOfStockAlerts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Low or out of stock items
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick actions based on role */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hasPermission('orders:write') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/orders')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Create Order
                    </CardTitle>
                    <CardDescription>
                      Start a new order for a customer
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {hasPermission('orders:approve') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/orders')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserCheck className="mr-2 h-5 w-5" />
                      Approve Orders
                    </CardTitle>
                    <CardDescription>
                      Review and approve pending orders
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {hasPermission('customers:write') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/customers')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="mr-2 h-5 w-5" />
                      Add Customer
                    </CardTitle>
                    <CardDescription>
                      Register a new customer
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {hasPermission('visits:write') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/visits')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserCheck className="mr-2 h-5 w-5" />
                      Schedule Visit
                    </CardTitle>
                    <CardDescription>
                      Plan a customer visit
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}



              {hasPermission('reports:read') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/reports')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      View Reports
                    </CardTitle>
                    <CardDescription>
                      Access sales and analytics
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>

          {/* Top products */}
          {stats?.topProducts && stats.topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {user?.role_id === 'admin-role-id' ? 'Top Products' : 'My Top Products'}
                </CardTitle>
                <CardDescription>
                  {user?.role_id === 'admin-role-id' 
                    ? 'Best selling products this month' 
                    : 'Your best selling products'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-sm text-gray-500">{product.qty_sold} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs. {product.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};