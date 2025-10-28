import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load page components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));
const Products = lazy(() => import('./pages/Products'));
const Visits = lazy(() => import('./pages/Visits'));
const Users = lazy(() => import('./pages/Users'));
const SystemLogs = lazy(() => import('./pages/SystemLogs'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const CustomerPortals = lazy(() => import('./pages/CustomerPortals'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const SharedCatalogs = lazy(() => import('./pages/SharedCatalogs'));
const Reports = lazy(() => import('./pages/Reports'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading application...</p>
                </div>
              </div>
            }>
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
                        <Visits />
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
                  path="/deliveries" 
                  element={
                    <ProtectedRoute requiredPermissions={['deliveries:read']}>
                      <Layout title="My Deliveries">
                        <Deliveries />
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
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
