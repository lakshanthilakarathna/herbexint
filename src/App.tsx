import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Products from './pages/Products';

import Users from './pages/Users';
import SystemLogs from './pages/SystemLogs';
import CustomerPortal from './pages/CustomerPortal';
import CustomerPortals from './pages/CustomerPortals';
import ProductCatalog from './pages/ProductCatalog';
import SharedCatalogs from './pages/SharedCatalogs';
import Reports from './pages/Reports';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute requiredPermissions={['orders:read']}>
                  <Layout title="Orders">
                    <Orders />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute requiredPermissions={['customers:read']}>
                  <Layout title="Customers">
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute requiredPermissions={['products:read']}>
                  <Layout title="Products">
                    <Products />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/visits" 
              element={
                <ProtectedRoute requiredPermissions={['visits:read']}>
                  <Layout title="Visit Tracking">
                    <div className="p-8">
                      <p>Visit tracking functionality coming soon...</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requiredPermissions={['reports:read']}>
                  <Layout title="Reports & Analytics">
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredPermissions={['users:read']}>
                  <Layout title="User Management">
                    <Users />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredPermissions={['settings:read']}>
                  <Layout title="System Settings">
                    <div className="p-8">
                      <p>Settings functionality coming soon...</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/logs" 
              element={
                <ProtectedRoute requiredPermissions={['audit:read']}>
                  <Layout title="System Logs">
                    <SystemLogs />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route path="/catalog" element={<ProductCatalog />} />
            <Route path="/customer-portal/:portalId" element={<CustomerPortal />} />
            <Route 
              path="/customer-portals" 
              element={
                <ProtectedRoute requiredPermissions={['customers:read']}>
                  <Layout title="Customer Portals">
                    <CustomerPortals />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shared-catalogs" 
              element={
                <ProtectedRoute requiredPermissions={['products:read']}>
                  <Layout title="Shared Catalogs">
                    <SharedCatalogs />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
