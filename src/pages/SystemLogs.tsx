import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Search, Filter, FileText, User, ShoppingCart, Package, Users, RefreshCw, Clock } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface SystemLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource_type: 'order' | 'customer' | 'product' | 'user' | 'login' | 'logout' | 'other';
  resource_id?: string;
  details?: string;
  ip_address?: string;
  status: 'success' | 'error' | 'warning';
}

const SystemLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      // For now, generate sample logs from actual user actions
      // In production, these would be logged by the backend
      const sampleLogs: SystemLog[] = [];
      
      // Get recent orders
      const orders = await apiClient.getOrders();
      orders.slice(0, 20).forEach((order: any) => {
        sampleLogs.push({
          id: `log-order-${order.id}`,
          timestamp: order.created_at,
          user_id: order.created_by || 'system',
          user_name: getUserNameFromId(order.created_by),
          user_email: getUserEmailFromId(order.created_by),
          action: 'Created Order',
          resource_type: 'order',
          resource_id: order.order_number,
          details: `Order ${order.order_number} for ${order.customer_name} - Rs. ${order.total_amount?.toFixed(2)}`,
          status: 'success'
        });

        if (order.updated_at !== order.created_at) {
          sampleLogs.push({
            id: `log-order-update-${order.id}`,
            timestamp: order.updated_at,
            user_id: order.created_by || 'system',
            user_name: getUserNameFromId(order.created_by),
            user_email: getUserEmailFromId(order.created_by),
            action: 'Updated Order',
            resource_type: 'order',
            resource_id: order.order_number,
            details: `Modified order ${order.order_number} - Status: ${order.status}`,
            status: 'success'
          });
        }
      });

      // Get recent customers
      const customers = await apiClient.getCustomers();
      customers.slice(0, 10).forEach((customer: any) => {
        sampleLogs.push({
          id: `log-customer-${customer.id}`,
          timestamp: customer.created_at,
          user_id: 'admin-user-id',
          user_name: 'Admin User',
          user_email: 'admin@herb.com',
          action: 'Created Customer',
          resource_type: 'customer',
          resource_id: customer.name,
          details: `Added customer: ${customer.name}`,
          status: 'success'
        });
      });

      // Get recent products
      const products = await apiClient.getProducts();
      const actualProducts = products.filter((p: any) => 
        p.category !== '__customer_portal__' && p.category !== '__shared_catalog__'
      ).slice(0, 10);
      
      actualProducts.forEach((product: any) => {
        sampleLogs.push({
          id: `log-product-${product.id}`,
          timestamp: product.created_at,
          user_id: 'admin-user-id',
          user_name: 'Admin User',
          user_email: 'admin@herb.com',
          action: 'Created Product',
          resource_type: 'product',
          resource_id: product.product_name,
          details: `Added product: ${product.brand_name} ${product.product_name}`,
          status: 'success'
        });
      });

      // Sort by timestamp (most recent first)
      sampleLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(sampleLogs.slice(0, 100)); // Show last 100 logs
      console.log('Loaded system logs:', sampleLogs.length);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load system logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserNameFromId = (userId: string) => {
    if (!userId || userId === 'system') return 'System';
    if (userId === 'customer-portal') return 'Customer';
    if (userId === 'admin-user-id') return 'Admin User';
    if (userId === 'sales-rep-1') return 'Sanjaya';
    if (userId === 'sales-rep-3') return 'Madhawa';
    if (userId === 'sales-rep-4') return 'Wajira';
    if (userId === 'legacy-sales-rep') return 'Legacy Sales Rep';
    return 'Unknown User';
  };

  const getUserEmailFromId = (userId: string) => {
    if (!userId || userId === 'system') return 'system@internal';
    if (userId === 'customer-portal') return 'customer@portal';
    if (userId === 'admin-user-id') return 'admin@herb.com';
    if (userId === 'sales-rep-1') return 'sales1@herb.com';
    return 'unknown@system';
  };

  const getResourceIcon = (type: SystemLog['resource_type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'login':
        return <User className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: SystemLog['status']) => {
    const config = {
      success: { color: 'bg-green-100 text-green-800', label: 'Success' },
      error: { color: 'bg-red-100 text-red-800', label: 'Error' },
      warning: { color: 'bg-yellow-100 text-yellow-800', label: 'Warning' }
    };
    
    const { color, label } = config[status];
    return <Badge className={color}>{label}</Badge>;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesUser = userFilter === 'all' || log.user_id === userFilter;
    
    return matchesSearch && matchesResource && matchesStatus && matchesUser;
  });

  const uniqueUsers = Array.from(new Set(logs.map(l => l.user_id)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                System Logs
              </CardTitle>
              <CardDescription>
                Activity logs for all users (Admin Only)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(userId => (
                  <SelectItem key={userId} value={userId}>
                    {getUserNameFromId(userId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile View - Card Layout */}
          <div className="block lg:hidden space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No logs found.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resource_type)}
                        <span className="font-semibold text-sm">{log.action}</span>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-3 h-3 mr-2" />
                        <span className="font-medium">{log.user_name}</span>
                        <span className="text-xs text-gray-400 ml-1">({log.user_email})</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-3 h-3 mr-2" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {log.details && (
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Timestamp</TableHead>
                  <TableHead className="min-w-[120px]">User</TableHead>
                  <TableHead className="min-w-[100px]">Action</TableHead>
                  <TableHead className="min-w-[100px]">Resource</TableHead>
                  <TableHead className="min-w-[300px]">Details</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No logs found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{log.user_name}</div>
                          <div className="text-xs text-gray-500">{log.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resource_type)}
                          <span className="font-medium text-sm">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.resource_type}
                        </Badge>
                        {log.resource_id && (
                          <div className="text-xs text-gray-500 mt-1">{log.resource_id}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{log.details || '-'}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Log Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Total Logs</div>
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Success</div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredLogs.filter(l => l.status === 'success').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Errors</div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredLogs.filter(l => l.status === 'error').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Active Users</div>
                <div className="text-2xl font-bold text-blue-600">
                  {uniqueUsers.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;

