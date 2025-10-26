import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getRoleDisplayName = (roleId: string) => {
    const roleMap: Record<string, string> = {
      'admin-role-id': 'System Administrator',
      'sales-manager-role-id': 'Sales Manager',
      'sales-rep-role-id': 'Sales Representative',
      'pharmacist-role-id': 'Distributor/Retailer',
      'finance-role-id': 'Finance Manager',
      'auditor-role-id': 'Auditor'
    };
    return roleMap[roleId] || 'Unknown Role';
  };

  const getRoleBadgeVariant = (roleId: string): "default" | "destructive" | "secondary" | "outline" => {
    if (roleId === 'admin-role-id') return 'destructive';
    if (roleId === 'sales-manager-role-id') return 'default';
    if (roleId === 'sales-rep-role-id') return 'secondary';
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

  const filteredSidebarItems = useMemo(() => {
    return sidebarItems.filter(item => {
      // Always show items without permission requirement
      if (!item.permission || item.permission === null) {
        return true;
      }
      // Check permission for items that require it
      return hasPermission(item.permission);
    });
  }, [user?.permissions]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <img 
                src="/herbexint.png" 
                alt="HERB" 
                className="h-8 w-auto object-contain"
              />
              <h2 className="text-sm font-semibold">HERB</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {filteredSidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.title}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              );
            })}
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
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {/* Dashboard */}
            <Button variant={location.pathname === '/dashboard' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/dashboard')}>
              <BarChart3 className="mr-2 h-4 w-4" />Dashboard
            </Button>
            {/* Orders */}
            {hasPermission('orders:read') && (
              <Button variant={location.pathname === '/orders' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/orders')}>
                <ShoppingCart className="mr-2 h-4 w-4" />Orders
              </Button>
            )}
            {/* Customers */}
            {hasPermission('customers:read') && (
              <Button variant={location.pathname === '/customers' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/customers')}>
                <Building2 className="mr-2 h-4 w-4" />Customers
              </Button>
            )}
            {/* Products */}
            {hasPermission('products:read') && (
              <Button variant={location.pathname === '/products' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/products')}>
                <Package className="mr-2 h-4 w-4" />Products
              </Button>
            )}
            {/* Visits */}
            {hasPermission('visits:read') && (
              <Button variant={location.pathname === '/visits' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/visits')}>
                <UserCheck className="mr-2 h-4 w-4" />Visits
              </Button>
            )}
            {/* Reports */}
            {hasPermission('reports:read') && (
              <Button variant={location.pathname === '/reports' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/reports')}>
                <FileText className="mr-2 h-4 w-4" />Reports
              </Button>
            )}
            {/* Users */}
            {hasPermission('users:read') && (
              <Button variant={location.pathname === '/users' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/users')}>
                <Users className="mr-2 h-4 w-4" />Users
              </Button>
            )}
            {/* Settings */}
            {hasPermission('settings:read') && (
              <Button variant={location.pathname === '/settings' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />Settings
              </Button>
            )}
            {/* Logs */}
            {hasPermission('audit:read') && (
              <Button variant={location.pathname === '/logs' ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate('/logs')}>
                <FileText className="mr-2 h-4 w-4" />Logs
              </Button>
            )}
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
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
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <Badge variant={getRoleBadgeVariant(user?.role_id || '')}>
                    {getRoleDisplayName(user?.role_id || '')}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="lg:hidden">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-gray-400">
              Developed by K 19
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

