import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Package, TrendingUp, Star, MapPin } from 'lucide-react';
import { generateAdminOrderNumber, generateSalesRepOrderNumber } from '@/lib/orderNumberGenerator';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'shipped' | 'delivered';
  order_date: string;
  delivery_date?: string;
  items: OrderItem[];
  notes?: string;
  created_by: string;
  approved_by?: string;
  assigned_to?: string; // Delivery person ID
  delivery_confirmation?: {
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    photo?: string; // Base64 or URL
    delivery_notes?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  brand_name?: string;
  product_name?: string;
  category?: string;
  image_url?: string;
  wholesale_price?: number;
  retail_price?: number;
  bonus?: string;
  unit?: string;
  manufacturer?: string;
}

const Orders: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    customer_id: '',
    items: [],
    notes: '',
    status: 'pending'
  });
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState<boolean>(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    fetchUsers();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.product-suggestions-container')) {
        setShowProductSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch from backend API only (no localStorage)
      const data = await apiClient.getOrders();
      const allOrders = Array.isArray(data) ? data : [];
      
      setOrders(allOrders);
      console.log('Loaded orders from database:', allOrders.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders from database');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Fetch from backend API
      const data = await apiClient.getCustomers();
      const formattedCustomers = Array.isArray(data) ? data.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone
      })) : [];
      setCustomers(formattedCustomers);
      console.log('Loaded customers for orders:', formattedCustomers.length);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch from backend API
      const data = await apiClient.getProducts();
      // Filter out customer portal and catalog entries
      const actualProducts = Array.isArray(data) ? data.filter((p: any) => 
        p.category !== '__customer_portal__' && p.category !== '__shared_catalog__'
      ) : [];
      const formattedProducts = actualProducts.map((p: any) => ({
        id: p.id,
        name: `${p.brand_name} - ${p.product_name}`,
        description: p.description || '',
        price: p.wholesale_price || 0,
        stock_quantity: p.stock_quantity || 0,
        brand_name: p.brand_name || '',
        product_name: p.product_name || '',
                    category: p.category || 'liquor',
        image_url: p.image_url || '',
        wholesale_price: p.wholesale_price || 0,
        cost_price: p.wholesale_price || 0,
        retail_price: p.retail_price || 0,
        bonus: p.bonus || '',
        unit: p.unit || 'pieces',
        manufacturer: p.manufacturer || ''
      }));
      setProducts(formattedProducts);
      console.log('Loaded products for orders:', formattedProducts.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Fix legacy orders that have timestamp IDs instead of user IDs
  const fixLegacyOrders = async () => {
    try {
      if (!user) return; // Wait for user to be loaded
      
      const allOrders = await apiClient.getOrders();
      
      // Map specific timestamp IDs to user IDs
      const timestampToUser: Record<string, string> = {
        '1760288194474': 'sales-rep-3', // Madhawa
        '1760286914826': 'sales-rep-3', // Madhawa (if this is also Madhawa)
        // Add more mappings here as needed
      };
      
      let fixedCount = 0;
      for (const order of allOrders) {
        // Check if created_by is a timestamp (13-digit number)
        if (/^\d{13}$/.test(order.created_by)) {
          // Get the correct user ID for this timestamp
          const correctUserId = timestampToUser[order.created_by] || 'legacy-sales-rep';
          
          // Update to show correct user instead of timestamp
          try {
            await apiClient.updateOrder(order.id, {
              created_by: correctUserId,
              updated_at: new Date().toISOString()
            });
            fixedCount++;
          } catch (error) {
            console.error(`Failed to fix order ${order.order_number}:`, error);
          }
        }
      }
      
      if (fixedCount > 0) {
        // Refresh orders to show updated data
        setTimeout(() => fetchOrders(), 1000);
      }
    } catch (error) {
      console.error('Error fixing legacy orders:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Load users from database (so all admins/reps can see who created orders)
      const dbUsers = await apiClient.getUsers();
      const usersFromDb = Array.isArray(dbUsers) ? dbUsers : [];
      
      // Include default users as fallback (Admin + 2 Sales Representatives)
      const defaultUsers = [
        {
          id: 'admin-user-id',
          name: 'Admin User',
          email: 'admin@herb.com',
          role_id: 'admin-role-id',
          role_name: 'System Administrator',
          status: 'active'
        },
        {
          id: 'sales-rep-1',
          name: 'Sales Rep 1',
          email: 'sales1@herb.com',
          role_id: 'sales-rep-role-id',
          role_name: 'Sales Representative',
          status: 'active'
        },
      ];

      // Combine database users with default users (remove duplicates by ID)
      const userMap = new Map();
      
      // Add database users first (higher priority)
      usersFromDb.forEach((u: any) => userMap.set(u.id, u));
      
      // Add default users if not already in database
      defaultUsers.forEach(u => {
        if (!userMap.has(u.id)) {
          userMap.set(u.id, u);
        }
      });
      
      const allUsers = Array.from(userMap.values());
      setUsers(allUsers);
      console.log('Loaded users for orders:', allUsers.length, '(', usersFromDb.length, 'from database)');
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to default users only
      setUsers([
        { id: 'admin-user-id', name: 'Admin User', email: 'admin@herb.com', role_id: 'admin-role-id', role_name: 'System Administrator', status: 'active' },
        { id: 'sales-rep-1', name: 'Sales Rep 1', email: 'sales1@herb.com', role_id: 'sales-rep-role-id', role_name: 'Sales Representative', status: 'active' }
      ]);
    }
  };

  // Helper to get user name by ID
  const getUserName = (userId: string) => {
    if (userId === 'customer-portal') return 'Customer';
    if (userId === 'legacy-sales-rep') return 'Legacy Sales Rep';
    
    // Try to match by ID
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      return foundUser.name;
    }
    
    // If it's the current logged-in user, show their name
    if (user?.id === userId) {
      return user.name;
    }
    
    // Safety check for undefined/null userId
    if (!userId) {
      return 'Unknown';
    }
    
    // Check if it's a timestamp ID (legacy orders before user ID fix)
    // These are numbers like 1760288194474
    // Instead of showing the number, show a friendly name
    if (/^\d{13}$/.test(userId)) {
      return 'Legacy Sales Rep';
    }
    
    // For unknown users, try to extract name from user ID
    // Format: user-email-domain-com → email@domain.com → email
    if (userId.startsWith('user-')) {
      const emailPart = userId.replace('user-', '').split('-')[0];
      return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
    }
    
    return 'Unknown';
  };

  const getDeliveryPersonName = (deliveryPersonId: string | undefined) => {
    if (!deliveryPersonId) return 'Not assigned';
    return getUserName(deliveryPersonId);
  };

  // Helper function to get filtered products for suggestions
  const getFilteredProducts = () => {
    return products.filter(product => {
      // Safety check for undefined/null product
      if (!product) return false;
      
      // Safety check for undefined/null name
      const productName = product.name || `${product.brand_name || ''} ${product.product_name || ''}`.trim() || 'Unknown Product';
      const matchesSearch = productName.toLowerCase().includes(productSearch.toLowerCase()) ||
                           product.brand_name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                           product.product_name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                           product.manufacturer?.toLowerCase().includes(productSearch.toLowerCase());
      // Safety check for undefined/null category
      const productCategory = product.category || 'liquor'; // Default to 'liquor'
      const matchesCategory = productCategoryFilter === 'all' || productCategory === productCategoryFilter;
      return matchesSearch && matchesCategory && (product.stock_quantity || 0) > 0;
    }).slice(0, 10); // Limit to 10 suggestions
  };

  // Helper function to get recently used products
  const getRecentProducts = () => {
    const recentProductIds = newOrder.items?.map(item => item.product_id) || [];
    return products.filter(product => 
      recentProductIds.includes(product.id)
    ).slice(0, 5);
  };

  // Helper function to get popular products (high stock or recently added)
  const getPopularProducts = () => {
    return products
      .filter(product => product.stock_quantity > 50) // High stock products
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 5);
  };

  const handleAddProduct = () => {
    if (!selectedProduct || selectedQuantity <= 0) {
      toast.error('Please select a product and quantity');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existingItem = newOrder.items?.find(item => item.product_id === selectedProduct);
    
    if (existingItem) {
      // Update quantity if product already exists
      const updatedItems = newOrder.items!.map(item => 
        item.product_id === selectedProduct 
          ? { ...item, quantity: item.quantity + selectedQuantity, total_price: (item.quantity + selectedQuantity) * item.unit_price }
          : item
      );
      setNewOrder({ ...newOrder, items: updatedItems });
    } else {
      // Add new product
      const newItem: OrderItem = {
        id: String((newOrder.items?.length || 0) + 1),
        product_id: product.id,
        product_name: product.name,
        quantity: selectedQuantity,
        unit_price: product.price,
        total_price: product.price * selectedQuantity
      };
      setNewOrder({ ...newOrder, items: [...(newOrder.items || []), newItem] });
    }

    setSelectedProduct('');
    setSelectedQuantity(1);
    setProductSearch('');
    setShowProductSuggestions(false);
    toast.success('Product added to order');
  };

  const handleQuickAddProduct = (productId: string, quantity: number = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = newOrder.items?.find(item => item.product_id === productId);
    
    if (existingItem) {
      const updatedItems = newOrder.items!.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: item.quantity + quantity, total_price: (item.quantity + quantity) * item.unit_price }
          : item
      );
      setNewOrder({ ...newOrder, items: updatedItems });
    } else {
      const newItem: OrderItem = {
        id: String((newOrder.items?.length || 0) + 1),
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        unit_price: product.price,
        total_price: product.price * quantity
      };
      setNewOrder({ ...newOrder, items: [...(newOrder.items || []), newItem] });
    }

    toast.success(`${product.name} added to order`);
  };

  const handleRemoveProduct = (productId: string) => {
    const updatedItems = newOrder.items?.filter(item => item.product_id !== productId) || [];
    setNewOrder({ ...newOrder, items: updatedItems });
    toast.success('Product removed from order');
  };

  const handleUpdateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = newOrder.items?.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
        : item
    ) || [];
    
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const calculateTotal = () => {
    return newOrder.items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
  };


  const handleCreateOrder = async () => {
    try {
      console.log('Creating order with data:', newOrder);
      
      if (!newOrder.customer_id) {
        toast.error('Please select a customer');
        return;
      }

      if (!newOrder.items || newOrder.items.length === 0) {
        toast.error('Please add at least one product to the order');
        return;
      }

      // Automatically capture location for the order
      let locationData = undefined;
      try {
        toast.info('Getting your location... Please wait', { duration: 3000 });
        console.log('🌍 Attempting to get location for order tracking...');
        
        const location = await getLocationWithFallback();
        if (location) {
          locationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            timestamp: new Date().toISOString()
          };
          
          // Check if it's a fallback location
          if (location.address.includes('Fallback') || location.address.includes('HTTP connection') || location.address.includes('IP-based location')) {
            toast.warning(`Using approximate location: ${location.address}`, { duration: 5000 });
          } else {
            toast.success(`Location captured: ${location.address}`, { duration: 4000 });
          }
          console.log('✅ Location data captured:', locationData);
        } else {
          console.log('ℹ️ No location data available - order will be created without location tracking');
          toast.warning('Could not capture GPS location. Order will be created without location tracking.', { duration: 6000 });
        }
      } catch (error) {
        console.log('ℹ️ Location capture failed - order will be created without location tracking:', error);
        if (error.message.includes('HTTPS')) {
          toast.error('GPS location requires HTTPS. Please enable HTTPS on your server for GPS location tracking.', { duration: 8000 });
        } else {
          toast.warning('GPS location capture failed. Please check your browser location permissions and try again. Order will be created without location tracking.', { duration: 6000 });
        }
      }


      // Generate unique order number based on user role
      let orderNumber: string;
      if (user?.role_id === 'admin-role-id') {
        orderNumber = generateAdminOrderNumber();
      } else {
        orderNumber = generateSalesRepOrderNumber(user?.id || 'unknown');
      }
      const total = newOrder.items.reduce((sum, item) => sum + item.total_price, 0);
      
      const newOrderData: Order = {
        id: String(Date.now()), // Use timestamp for unique ID
        order_number: orderNumber,
        customer_id: newOrder.customer_id,
        customer_name: customers.find(c => c.id === newOrder.customer_id)?.name || 'Unknown Customer',
        total_amount: total,
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
        items: [...newOrder.items],
        notes: newOrder.notes || '',
        created_by: user?.id || 'system',
        location: locationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Created order data:', newOrderData);
      
      // Save to backend API
      const created = await apiClient.createOrder(newOrderData);
      
      // Update product stock quantities
      toast.info('Updating product stock levels...', { duration: 2000 });
      let stockUpdateCount = 0;
      for (const item of newOrder.items) {
        try {
          // Fetch fresh product data from database to get current stock
          const freshProduct = await apiClient.getProduct(item.product_id);
          if (freshProduct) {
            const currentStock = freshProduct.stock_quantity || 0;
            const newStockQuantity = currentStock - item.quantity;
            const productName = freshProduct.product_name || freshProduct.name || 'Product';
            console.log(`Updating stock for ${productName}: ${currentStock} → ${newStockQuantity}`);
            
            // Update product stock in database
            await apiClient.updateProduct(item.product_id, {
              stock_quantity: Math.max(0, newStockQuantity) // Don't go below 0
            });
            stockUpdateCount++;
          }
        } catch (stockError) {
          console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
        }
      }
      
      // Refresh products to show updated stock
      await fetchProducts();
      
      // Update local state
      setOrders([created, ...orders]);
      setIsCreateDialogOpen(false);
      setNewOrder({ customer_id: '', items: [], notes: '', status: 'pending' });
      setSelectedProduct('');
      setSelectedQuantity(1);
      setCustomerSearch('');
      setProductSearch('');
      toast.success(`Order ${orderNumber} created! Stock updated for ${stockUpdateCount} products.`);
    } catch (error) {
      toast.error('Failed to create order');
      console.error('Error creating order:', error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      
      // Update via API
      await apiClient.updateOrder(orderId, {
        status: newStatus,
        approved_by: newStatus === 'approved' ? user?.id : undefined,
        updated_at: new Date().toISOString()
      });
      
      // Note: Order status can only be updated to valid statuses
      // Stock restoration is not needed anymore with simplified statuses
      if (false && order && order.items) {
        toast.info('Restoring product stock...', { duration: 2000 });
        let stockRestoreCount = 0;
        
        for (const item of order.items) {
          try {
            // Fetch fresh product data from database
            const freshProduct = await apiClient.getProduct(item.product_id);
            if (freshProduct) {
              const currentStock = freshProduct.stock_quantity || 0;
              const newStockQuantity = currentStock + item.quantity;
              const productName = freshProduct.product_name || freshProduct.name || 'Product';
              console.log(`Restoring stock for ${productName}: ${currentStock} → ${newStockQuantity} (order ${newStatus})`);
              
              await apiClient.updateProduct(item.product_id, {
                stock_quantity: newStockQuantity
              });
              stockRestoreCount++;
            }
          } catch (stockError) {
            console.error(`Failed to restore stock for product ${item.product_id}:`, stockError);
          }
        }
        
        // Refresh products to show updated stock
        await fetchProducts();
        
        toast.success(`Order ${newStatus}! Stock restored for ${stockRestoreCount} products.`);
      } else {
        toast.success(`Order status updated to ${newStatus}`);
      }
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: newStatus as Order['status'],
              approved_by: newStatus === 'approved' ? user?.id : order.approved_by,
              updated_at: new Date().toISOString()
            }
          : order
      ));
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Error updating order status:', error);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;

    try {
      // Validate: If status is shipped, must have delivery person assigned
      if (selectedOrder.status === 'shipped' && !selectedOrder.assigned_to) {
        toast.error('Orders with status "Shipped" must be assigned to a delivery person');
        return;
      }

      // Get the original order to compare item quantities
      const originalOrder = orders.find(o => o.id === selectedOrder.id);
      
      // Update order via API (includes items, total, notes, status, delivery_date, assigned_to)
      await apiClient.updateOrder(selectedOrder.id, {
        items: selectedOrder.items,
        total_amount: selectedOrder.total_amount,
        status: selectedOrder.status,
        notes: selectedOrder.notes,
        delivery_date: selectedOrder.delivery_date,
        assigned_to: selectedOrder.assigned_to,
        updated_at: new Date().toISOString()
      });
      
      // Also update status specifically for better sync
      await apiClient.updateOrderStatus(selectedOrder.id, selectedOrder.status);

      // Adjust product stock quantities based on changes
      if (originalOrder) {
        toast.info('Adjusting product stock...', { duration: 2000 });
        let stockAdjustCount = 0;
        
        // Create maps for easier comparison
        const originalItems = new Map(originalOrder.items.map(item => [item.product_id, item.quantity]));
        const newItems = new Map(selectedOrder.items.map(item => [item.product_id, item.quantity]));
        
        // Check all products (both old and new)
        const allProductIds = new Set([...originalItems.keys(), ...newItems.keys()]);
        
        for (const productId of allProductIds) {
          try {
            // Fetch fresh product data from database
            const freshProduct = await apiClient.getProduct(productId);
            if (!freshProduct) continue;
            
            const originalQty = originalItems.get(productId) || 0;
            const newQty = newItems.get(productId) || 0;
            const difference = newQty - originalQty;
            
            if (difference !== 0) {
              // Negative difference = less ordered = restore stock
              // Positive difference = more ordered = reduce stock
              const currentStock = freshProduct.stock_quantity || 0;
              const newStockQuantity = currentStock - difference;
              const productName = freshProduct.product_name || freshProduct.name || 'Product';
              console.log(`Adjusting stock for ${productName}: ${currentStock} → ${newStockQuantity} (order change: ${difference > 0 ? '+' : ''}${difference})`);
              
              await apiClient.updateProduct(productId, {
                stock_quantity: Math.max(0, newStockQuantity)
              });
              stockAdjustCount++;
            }
          } catch (stockError) {
            console.error(`Failed to adjust stock for product ${productId}:`, stockError);
          }
        }
        
        // Refresh products to show updated stock
        if (stockAdjustCount > 0) {
          await fetchProducts();
          toast.success(`Order updated! Stock adjusted for ${stockAdjustCount} products. Status synced.`);
        } else {
          toast.success('Order updated successfully! Status synced.');
        }
      }

      // Update local state
      const updatedOrder = {...selectedOrder, updated_at: new Date().toISOString()};
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      ));
      
      // Refresh orders to show updated data
      await fetchOrders();
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? Stock will be restored.')) {
      return;
    }

    try {
      // Find the order to get its items
      const orderToDelete = orders.find(o => o.id === orderId);
      
      // Delete via API (works for all orders)
      await apiClient.deleteOrder(orderId);
      
      // Restore product stock quantities
      if (orderToDelete && orderToDelete.items) {
        toast.info('Restoring product stock...', { duration: 2000 });
        let stockRestoreCount = 0;
        for (const item of orderToDelete.items) {
          try {
            // Fetch fresh product data from database
            const freshProduct = await apiClient.getProduct(item.product_id);
            if (freshProduct) {
              const currentStock = freshProduct.stock_quantity || 0;
              const newStockQuantity = currentStock + item.quantity;
              const productName = freshProduct.product_name || freshProduct.name || 'Product';
              console.log(`Restoring stock for ${productName}: ${currentStock} → ${newStockQuantity}`);
              
              // Update product stock in database
              await apiClient.updateProduct(item.product_id, {
                stock_quantity: newStockQuantity
              });
              stockRestoreCount++;
            }
          } catch (stockError) {
            console.error(`Failed to restore stock for product ${item.product_id}:`, stockError);
          }
        }
        
        // Refresh products to show updated stock
        await fetchProducts();
        
        setOrders(orders.filter(order => order.id !== orderId));
        toast.success(`Order deleted! Stock restored for ${stockRestoreCount} products.`);
      } else {
        setOrders(orders.filter(order => order.id !== orderId));
        toast.success('Order deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order');
    }
  };

  const getStatusBadge = (status: Order['status'], order?: Order) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    // Add lock indicator for sales reps when order is not pending
    const isLocked = order && 
                    user?.role_id !== 'admin-role-id' && 
                    order.created_by === user?.id && 
                    status !== 'pending';
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
        {isLocked && (
          <span className="ml-1" title="Order locked - Admin approval required">🔒</span>
        )}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Sales Representatives can only see their own orders
    // Admin can see all orders
    const isAdmin = user?.role_id === 'admin-role-id';
    const matchesUser = isAdmin || order.created_by === user?.id;
    
    return matchesSearch && matchesStatus && matchesUser;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        {hasPermission('orders:write') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Create a new order for a customer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer <span className="text-red-500">*</span></Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={newOrder.customer_id} onValueChange={(value) => setNewOrder({...newOrder, customer_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers
                          .filter(customer => 
                            customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            customer.email.toLowerCase().includes(customerSearch.toLowerCase())
                          )
                          .map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        {customers.filter(customer => 
                          customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          customer.email.toLowerCase().includes(customerSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="p-2 text-sm text-gray-500">No customers found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Add Products</h4>
                  
                  {/* Product Category Filter */}
                  <div className="mb-4">
                    <Label>Filter by Category</Label>
                    <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="liquor">Liquor</SelectItem>
                        <SelectItem value="beer">Beer</SelectItem>
                        <SelectItem value="wine">Wine</SelectItem>
                        <SelectItem value="spirits">Spirits</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quick Add - Recently Used Products */}
                  {getRecentProducts().length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Recently Added to This Order
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {getRecentProducts().map(product => (
                          <Button
                            key={product.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAddProduct(product.id, 1)}
                            className="text-xs"
                          >
                            {product.name} (+1)
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Enhanced Product Search */}
                  <div className="space-y-3">
                    <div>
                      <Label>Search & Select Product</Label>
                      <div className="space-y-2 product-suggestions-container">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Type to search products, brands, or manufacturers..."
                            value={productSearch}
                            onChange={(e) => {
                              setProductSearch(e.target.value);
                              setShowProductSuggestions(e.target.value.length > 0);
                            }}
                            onFocus={() => setShowProductSuggestions(true)}
                            className="pl-8"
                          />
                        </div>
                        
                        {/* Product Suggestions Dropdown */}
                        {showProductSuggestions && getFilteredProducts().length > 0 && (
                          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredProducts().map(product => {
                              if (!product) return null;
                              return (
                                <div
                                  key={product.id}
                                  className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                    setSelectedProduct(product.id);
                                    setProductSearch(product.name || '');
                                    setShowProductSuggestions(false);
                                  }}
                                >
                                  <div className="flex items-start justify-between w-full gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm leading-tight">
                                        {product.brand_name || ''} {product.product_name || ''}
                                      </div>
                                    </div>
                                    <div className="text-sm font-semibold text-blue-600 flex-shrink-0 whitespace-nowrap">
                                      Rs. {(product.wholesale_price || product.price || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Manual Product Selection */}
                    <div>
                      <Label>Or Select from Full List</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product manually" />
                        </SelectTrigger>
                        <SelectContent>
                          {products
                            .filter(product => 
                              product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                              product.description.toLowerCase().includes(productSearch.toLowerCase())
                            )
                            .map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{product.brand_name} {product.product_name}</span>
                                  <span className="text-sm font-medium text-blue-600 ml-2">Rs. {(product.wholesale_price || product.price || 0).toFixed(2)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          {products.filter(product => 
                            product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            product.description.toLowerCase().includes(productSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="p-2 text-sm text-gray-500">No products found</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Quantity and Add Button */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Label>Quantity</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 px-3"
                            onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={selectedQuantity}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSelectedQuantity(val > 0 ? val : 1);
                            }}
                            className="text-center h-10"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 px-3"
                            onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>&nbsp;</Label>
                        <Button onClick={handleAddProduct} className="w-full h-10">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {newOrder.items && newOrder.items.length > 0 && (
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    
                    {/* Mobile View - Card Layout */}
                    <div className="block sm:hidden space-y-3">
                      {newOrder.items.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 font-medium text-sm pr-2">{item.product_name}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleRemoveProduct(item.product_id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Quantity:</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleUpdateItemQuantity(item.product_id, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(item.product_id, Number(e.target.value))}
                                  className="w-12 h-7 text-center px-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleUpdateItemQuantity(item.product_id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Unit Price:</span>
                              <span className="font-medium">Rs. {(item.unit_price || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-600 font-medium">Total:</span>
                              <span className="font-bold text-blue-600">Rs. {(item.total_price || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t-2 pt-3 flex justify-between items-center">
                        <span className="font-semibold text-lg">Order Total:</span>
                        <span className="font-bold text-lg text-green-600">Rs. {(calculateTotal() || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newOrder.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    onClick={() => handleUpdateItemQuantity(item.product_id, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateItemQuantity(item.product_id, Number(e.target.value))}
                                    className="w-14 h-8 text-center px-1 flex-shrink-0"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    onClick={() => handleUpdateItemQuantity(item.product_id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>Rs. {(item.unit_price || 0).toFixed(2)}</TableCell>
                              <TableCell>Rs. {(item.total_price || 0).toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(item.product_id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                            <TableCell className="font-bold">Rs. {(calculateTotal() || 0).toFixed(2)}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newOrder.notes || ''}
                    onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                    placeholder="Additional notes for this order"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewOrder({ customer_id: '', items: [], notes: '', status: 'draft' });
                    setSelectedProduct('');
                    setSelectedQuantity(1);
                    setCustomerSearch('');
                    setProductSearch('');
                    setProductCategoryFilter('all');
                    setShowProductSuggestions(false);
                  }}>
                    Cancel
                  </Button>
                  <Button className="w-full sm:w-auto" onClick={handleCreateOrder}>
                    Create Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                View and manage all customer orders
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Order Number</TableHead>
                <TableHead className="min-w-[150px]">Customer</TableHead>
                <TableHead className="min-w-[120px]">Total Amount</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Order Date</TableHead>
                <TableHead className="min-w-[120px]">Delivery Date</TableHead>
                <TableHead className="min-w-[120px]">Created By</TableHead>
                <TableHead className="min-w-[120px]">Assigned To</TableHead>
                <TableHead className="min-w-[120px]">Last Updated</TableHead>
                <TableHead className="min-w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{order.order_number || 'N/A'}</span>
                      {order.location && (
                        <MapPin className="w-3 h-3 text-blue-500" title="Location captured" />
                      )}
                      {order.created_by === 'customer-portal' && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs ml-2">Customer Portal</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{order.customer_name || 'Customer'}</TableCell>
                  <TableCell>Rs. {(order.total_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status, order)}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{getUserName(order.created_by)}</span>
                      {order.created_by === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getDeliveryPersonName(order.assigned_to)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{order.updated_at ? new Date(order.updated_at).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {order.updated_at ? new Date(order.updated_at).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {/* Sales Reps can edit only pending orders, Admin can edit all orders */}
                      {hasPermission('orders:write') && (
                        (user?.role_id === 'admin-role-id') || 
                        (order.created_by === user?.id && order.status === 'pending')
                      ) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {/* Show locked indicator for sales reps when order is not pending */}
                      {hasPermission('orders:write') && 
                       user?.role_id !== 'admin-role-id' && 
                       order.created_by === user?.id && 
                       order.status !== 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled
                          title="Order locked - Admin approval required"
                          className="opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('orders:delete') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Delete Order"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('orders:approve') && order.status === 'pending' && (
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleStatusChange(order.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleStatusChange(order.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View complete order information
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <p className="font-medium">{selectedOrder.order_number || 'N/A'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedOrder.status, selectedOrder)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{selectedOrder.customer_name || 'Customer'}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium">Rs. {(selectedOrder.total_amount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order Date</Label>
                  <p className="font-medium">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <p className="font-medium">
                    {selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Show update timestamp */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <Label className="text-gray-700">Created At</Label>
                  <p className="text-sm font-medium">
                    {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">Last Updated</Label>
                  <p className="text-sm font-medium text-orange-600">
                    {selectedOrder.updated_at ? new Date(selectedOrder.updated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedOrder.location && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <Label className="text-blue-900">Order Location</Label>
                      <p className="text-sm text-blue-800 mt-1">{selectedOrder.location.address}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        📍 {selectedOrder.location.latitude.toFixed(6)}, {selectedOrder.location.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        Captured: {new Date(selectedOrder.location.timestamp).toLocaleString()}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${selectedOrder.location.latitude},${selectedOrder.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <Label>Order Items</Label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.product_name || 'Product'}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Rs. {(item.total_price || 0).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">@ Rs. {(item.unit_price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Confirmation Section */}
              {selectedOrder.delivery_confirmation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <Label className="text-green-900 text-lg font-semibold">Delivery Confirmation</Label>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Delivery Timestamp */}
                    <div>
                      <Label className="text-green-800 font-medium">Confirmed At</Label>
                      <p className="text-sm text-green-700">
                        {new Date(selectedOrder.delivery_confirmation.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {/* Delivery Location */}
                    {selectedOrder.delivery_confirmation.location && (
                      <div>
                        <Label className="text-green-800 font-medium">Delivery Location</Label>
                        <div className="flex items-start gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm text-green-700">{selectedOrder.delivery_confirmation.location.address}</p>
                            <p className="text-xs text-green-600">
                              📍 {selectedOrder.delivery_confirmation.location.latitude.toFixed(6)}, {selectedOrder.delivery_confirmation.location.longitude.toFixed(6)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${selectedOrder.delivery_confirmation.location.latitude},${selectedOrder.delivery_confirmation.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:underline"
                            >
                              View on Google Maps →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Photo */}
                    {selectedOrder.delivery_confirmation.photo && (
                      <div>
                        <Label className="text-green-800 font-medium">Delivery Photo</Label>
                        <div className="mt-2">
                          <img 
                            src={selectedOrder.delivery_confirmation.photo} 
                            alt="Delivery confirmation" 
                            className="max-w-full h-auto max-h-64 rounded-lg border border-green-300"
                          />
                        </div>
                      </div>
                    )}


                    {/* Delivery Notes */}
                    {selectedOrder.delivery_confirmation.delivery_notes && (
                      <div>
                        <Label className="text-green-800 font-medium">Delivery Notes</Label>
                        <p className="text-sm text-green-700 mt-1 p-2 bg-white rounded border border-green-300">
                          {selectedOrder.delivery_confirmation.delivery_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Modify order information
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Items - Sales Reps and Admin can edit */}
              <div>
                <Label>Order Items</Label>
                
                {/* Add New Product to Order */}
                <div className="mb-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <Label className="text-sm font-medium mb-2">Add Product to Order</Label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select 
                        value={selectedProduct} 
                        onValueChange={setSelectedProduct}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - Rs. {(product.wholesale_price || product.price || 0).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(Number(e.target.value) || 1)}
                        placeholder="Qty"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!selectedProduct) {
                          toast.error('Please select a product');
                          return;
                        }
                        const product = products.find(p => p.id === selectedProduct);
                        if (!product) return;

                        const unitPrice = product.wholesale_price || product.price || 0;
                        const newItem: OrderItem = {
                          id: `item-${Date.now()}`,
                          product_id: product.id,
                          product_name: product.name,
                          quantity: selectedQuantity,
                          unit_price: unitPrice,
                          total_price: unitPrice * selectedQuantity
                        };

                        const newItems = [...(selectedOrder.items || []), newItem];
                        setSelectedOrder({
                          ...selectedOrder,
                          items: newItems,
                          total_amount: newItems.reduce((sum, i) => sum + i.total_price, 0)
                        });

                        setSelectedProduct('');
                        setSelectedQuantity(1);
                        toast.success('Product added to order');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-gray-500">Rs. {(item.unit_price || 0).toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              const newItems = [...selectedOrder.items];
                              if (newItems[index].quantity > 1) {
                                newItems[index] = {
                                  ...newItems[index],
                                  quantity: newItems[index].quantity - 1,
                                  total_price: (newItems[index].quantity - 1) * newItems[index].unit_price
                                };
                                setSelectedOrder({
                                  ...selectedOrder, 
                                  items: newItems,
                                  total_amount: newItems.reduce((sum, i) => sum + i.total_price, 0)
                                });
                              }
                            }}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              const newItems = [...selectedOrder.items];
                              newItems[index] = {
                                ...newItems[index],
                                quantity: newItems[index].quantity + 1,
                                total_price: (newItems[index].quantity + 1) * newItems[index].unit_price
                              };
                              setSelectedOrder({
                                ...selectedOrder, 
                                items: newItems,
                                total_amount: newItems.reduce((sum, i) => sum + i.total_price, 0)
                              });
                            }}
                          >
                            +
                          </Button>
                          <span className="font-medium text-sm ml-2">Rs. {(item.total_price || 0).toFixed(2)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const newItems = selectedOrder.items.filter((_, i) => i !== index);
                              setSelectedOrder({
                                ...selectedOrder, 
                                items: newItems,
                                total_amount: newItems.reduce((sum, i) => sum + i.total_price, 0)
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No items in this order</p>
                  )}
                </div>
                <div className="mt-2 flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span className="text-lg">Rs. {(selectedOrder.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedOrder.notes || ''}
                  onChange={(e) => setSelectedOrder({...selectedOrder, notes: e.target.value})}
                  placeholder="Additional notes for this order"
                />
              </div>
              
              {/* Status - Only Admin can edit */}
              {user?.role_id === 'admin-role-id' && (
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={selectedOrder.status} onValueChange={(value) => {
                    const newStatus = value as Order['status'];
                    console.log('🔄 Status change (local):', selectedOrder.status, '→', newStatus);
                    setSelectedOrder({...selectedOrder, status: newStatus});
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Assign to Delivery Personnel - Only Admin can edit, Only show when status is shipped */}
              {user?.role_id === 'admin-role-id' && selectedOrder.status === 'shipped' && (
                <div>
                  <Label htmlFor="edit-assigned-to">
                    Assign to Delivery Person <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedOrder.assigned_to || 'unassigned'} 
                    onValueChange={(value) => {
                      setSelectedOrder({...selectedOrder, assigned_to: value === 'unassigned' ? undefined : value});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery person (required)" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u: any) => u.role_name === 'Delivery Personnel' || u.role_id === 'delivery-role-id')
                        .map((deliveryPerson: any) => (
                          <SelectItem key={deliveryPerson.id} value={deliveryPerson.id}>
                            {deliveryPerson.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Orders with status "Shipped" must be assigned to a delivery person
                  </p>
                </div>
              )}

              {/* Delivery Date - Only Admin can edit */}
              {user?.role_id === 'admin-role-id' && (
                <div>
                  <Label htmlFor="edit-delivery-date">Delivery Date</Label>
                  <Input
                    id="edit-delivery-date"
                    type="date"
                    value={selectedOrder.delivery_date ? selectedOrder.delivery_date.split('T')[0] : ''}
                    onChange={(e) => {
                      setSelectedOrder({...selectedOrder, delivery_date: e.target.value});
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
