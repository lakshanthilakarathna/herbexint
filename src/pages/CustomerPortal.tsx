import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Package, MapPin, Phone, Mail, Building, CheckCircle, Clock, Truck, Trash2, User, RefreshCw } from 'lucide-react';

interface CustomerPortalData {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  unique_url: string;
  status: 'active' | 'inactive';
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  brand_name?: string;
  product_name?: string;
  image_url?: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  customer_portal_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  order_date: string;
  delivery_date?: string;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

const CustomerPortal: React.FC = () => {
  const { portalId } = useParams<{ portalId: string }>();
  const [portalData, setPortalData] = useState<CustomerPortalData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder | null>(null);
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (portalId) {
      fetchPortalData();
      fetchProducts();
      fetchOrders();
    }
  }, [portalId]);

  // Auto-refresh order status every 15 seconds if order is placed
  useEffect(() => {
    if (hasPlacedOrder && portalId) {
      console.log('Starting auto-refresh for order tracking...');
      const interval = setInterval(() => {
        console.log('Auto-refreshing order status...');
        fetchOrders();
      }, 15000); // Refresh every 15 seconds

      return () => {
        console.log('Stopping auto-refresh for order tracking');
        clearInterval(interval);
      };
    }
  }, [hasPlacedOrder, portalId]);

  const fetchPortalData = async () => {
    try {
      // Try to load from API first (so it works across devices)
      try {
        console.log('Attempting to load portal from database, ID:', portalId);
        const data = await apiClient.getCustomerPortal(portalId!);
        console.log('Portal data received:', data);
        
        if (!data || Object.keys(data).length === 0) {
          console.log('No portal data returned from API');
          throw new Error('Portal not found in database');
        }
        
        if (data.status === 'inactive') {
          toast.error('This customer portal is currently inactive');
          setPortalData(null);
          setLoading(false);
          return;
        }
        setPortalData(data);
        // Pre-fill form with portal data
        setOrderForm({
          customer_name: data.contact_person || '',
          customer_email: data.email || '',
          customer_phone: data.phone || '',
          delivery_address: data.address || '',
          notes: ''
        });
        console.log('Portal loaded from database successfully:', data);
      } catch (apiError) {
        console.error('API Error - Portal not found:', apiError);
        setPortalData(null);
      }
    } catch (error) {
      console.error('Error fetching portal data:', error);
      toast.error('Customer portal not found or inactive');
      setPortalData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      // Filter out customer portal and catalog entries
      const actualProducts = Array.isArray(data) ? data.filter((p: any) => 
        p.category !== '__customer_portal__' && p.category !== '__shared_catalog__'
      ) : [];
      const formattedProducts = actualProducts.map((p: any) => ({
        id: p.id,
        name: `${p.brand_name || ''} - ${p.product_name || ''}`,
        description: p.description || '',
        price: p.retail_price || 0,
        stock_quantity: p.stock_quantity || 0,
        brand_name: p.brand_name || '',
        product_name: p.product_name || '',
        image_url: p.image_url || ''
      }));
      setProducts(formattedProducts);
      console.log('Loaded products for customer portal:', formattedProducts.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    }
  };

  const fetchOrders = async (showToast = false) => {
    try {
      if (showToast) {
        setIsRefreshing(true);
        toast.info('Refreshing order status...', { duration: 2000 });
      }
      
      console.log('Fetching orders for portal:', portalId);
      
      // Load orders from API (gets all orders for this portal)
      const data = await apiClient.getCustomerOrders(portalId!);
      console.log('Orders received from API:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Get the first (and only) order for this portal
        const orderData = data[0];
        console.log('Order loaded from database:', orderData);
        
        // Check if order status has changed
        const statusChanged = currentOrder && currentOrder.status !== orderData.status;
        if (statusChanged) {
          console.log(`Order status changed: ${currentOrder.status} → ${orderData.status}`);
          toast.success(`Order status updated to: ${orderData.status}`, { duration: 4000 });
        }
        
        setCurrentOrder(orderData);
        setHasPlacedOrder(true);
        setOrders([orderData]);
        
        if (showToast) {
          toast.success('Order status refreshed', { duration: 2000 });
        }
      } else {
        console.log('No order found for this portal');
        setCurrentOrder(null);
        setHasPlacedOrder(false);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Don't reset state on error to avoid losing current order view
      console.log('Failed to fetch orders, keeping current state');
      if (showToast) {
        toast.error('Failed to refresh order status', { duration: 3000 });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      const newItem: OrderItem = {
        id: String(Date.now()),
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      };
      setCart([...cart, newItem]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
    toast.success('Item removed from cart');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handlePlaceOrder = async () => {
    try {
      if (cart.length === 0) {
        toast.error('Please add items to your cart');
        return;
      }

      if (!orderForm.customer_name || !orderForm.customer_email || !orderForm.delivery_address) {
        toast.error('Please fill in all required fields');
        return;
      }

      const orderNumber = `ORD-${String(Date.now()).slice(-8)}`;
      
      const newOrder: CustomerOrder = {
        id: String(Date.now()),
        order_number: orderNumber,
        customer_portal_id: portalId!,
        customer_name: orderForm.customer_name,
        customer_email: orderForm.customer_email,
        customer_phone: orderForm.customer_phone,
        delivery_address: orderForm.delivery_address,
        total_amount: calculateTotal(),
        items: cart,
        notes: orderForm.notes,
        status: 'pending',
        order_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save order via API to backend API
      const orderToSave = {
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_id: portalId || 'customer-portal',
        customer_name: orderForm.customer_name,
        customer_portal_id: portalId,
        customer_email: orderForm.customer_email,
        customer_phone: orderForm.customer_phone,
        delivery_address: orderForm.delivery_address,
        total_amount: newOrder.total_amount,
        status: 'pending',
        order_date: newOrder.order_date,
        delivery_date: '',
        items: newOrder.items,
        notes: orderForm.notes || '',
        created_by: 'customer-portal',
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at
      };
      
      console.log('Saving order to database:', orderToSave);
      await apiClient.createCustomerOrder(portalId!, orderToSave);
      
      // Update product stock quantities
      toast.info('Updating product stock levels...', { duration: 2000 });
      let stockUpdateCount = 0;
      for (const item of cart) {
        try {
          // Fetch fresh product data from database
          const freshProduct = await apiClient.getProduct(item.product_id);
          if (freshProduct) {
            const currentStock = freshProduct.stock_quantity || 0;
            const newStockQuantity = currentStock - item.quantity;
            const productName = freshProduct.product_name || freshProduct.name || 'Product';
            console.log(`Customer order - Updating stock for ${productName}: ${currentStock} → ${newStockQuantity}`);
            
            // Update product stock in database
            await apiClient.updateProduct(item.product_id, {
              stock_quantity: Math.max(0, newStockQuantity)
            });
            stockUpdateCount++;
          }
        } catch (stockError) {
          console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
        }
      }
      
      if (stockUpdateCount > 0) {
        console.log(`Stock updated for ${stockUpdateCount} products`);
        // Refresh products to show updated stock
        await fetchProducts();
      }
      
      // Update state immediately to show tracking view
      console.log('Setting hasPlacedOrder to true');
      console.log('Setting currentOrder:', newOrder);
      setCurrentOrder(newOrder);
      setHasPlacedOrder(true);
      setOrders([newOrder]);
      console.log('State updated, should show tracking view');
      
      // Reset form and cart
      setCart([]);
      setOrderForm({
        customer_name: portalData?.contact_person || '',
        customer_email: portalData?.email || '',
        customer_phone: portalData?.phone || '',
        delivery_address: portalData?.address || '',
        notes: ''
      });
      setIsOrderDialogOpen(false);
      
      toast.success(
        <div>
          <p className="font-semibold">Order placed successfully!</p>
          <p className="text-xs mt-1">Order #{orderNumber}</p>
          <p className="text-xs text-gray-600 mt-1">You will receive updates at {orderForm.customer_email}</p>
          {stockUpdateCount > 0 && (
            <p className="text-xs text-green-600 mt-1">✓ Product stock updated</p>
          )}
        </div>,
        { duration: 6000 }
      );
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    }
  };

  const getStatusBadge = (status: CustomerOrder['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: Trash2, label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending; // Default to pending if status is undefined
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!portalData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Portal Not Found</h1>
            <p className="text-gray-600">This customer portal does not exist or is inactive.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{portalData.business_name}</h1>
              <p className="text-sm sm:text-base text-gray-600">Order Portal</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-500">Contact Person</p>
                <p className="font-medium">{portalData.contact_person}</p>
              </div>
              {!hasPlacedOrder && (
                <Button
                  onClick={() => setIsOrderDialogOpen(true)}
                  disabled={cart.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Place Order ({cart.length})
                </Button>
              )}
              {hasPlacedOrder && currentOrder && (
                <Badge className="bg-green-100 text-green-800 px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Order #{currentOrder.order_number} - {currentOrder.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        {/* If order has been placed, show tracking view only */}
        {console.log('Render - hasPlacedOrder:', hasPlacedOrder, 'currentOrder:', !!currentOrder)}
        {hasPlacedOrder && currentOrder ? (
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <CardTitle>Order Placed Successfully</CardTitle>
                      <CardDescription>
                        Track your order status below
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOrders(true)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-green-700">Order Number</p>
                      <p className="text-xl font-bold text-green-900">#{currentOrder.order_number}</p>
                    </div>
                    {getStatusBadge(currentOrder.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-green-700">Order Date</p>
                      <p className="font-medium text-green-900">{new Date(currentOrder.order_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-green-700">Total Amount</p>
                      <p className="font-medium text-green-900">Rs. {(currentOrder.total_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div>
                  <h4 className="font-semibold mb-3">Delivery Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-600">Contact Person</p>
                        <p className="font-medium">{currentOrder.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{currentOrder.customer_email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium">{currentOrder.customer_phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-600">Delivery Address</p>
                        <p className="font-medium">{currentOrder.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {currentOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity} × Rs. {(item.unit_price || 0).toFixed(2)}</p>
                        </div>
                        <p className="font-semibold">Rs. {(item.total_price || 0).toFixed(2)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded font-semibold">
                      <span>Total Amount</span>
                      <span className="text-lg">Rs. {(currentOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Status Timeline */}
                <div>
                  <h4 className="font-semibold mb-3">Order Status</h4>
                  <div className="space-y-3">
                    <div className={`flex items-center gap-3 ${currentOrder.status === 'pending' ? 'text-yellow-600' : 'text-gray-400'}`}>
                      <Clock className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Pending</p>
                        <p className="text-xs">Waiting for approval</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 ${currentOrder.status === 'approved' ? 'text-blue-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Approved</p>
                        <p className="text-xs">Order confirmed</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 ${currentOrder.status === 'shipped' ? 'text-purple-600' : 'text-gray-400'}`}>
                      <Truck className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Shipped</p>
                        <p className="text-xs">Out for delivery</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 ${currentOrder.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Delivered</p>
                        <p className="text-xs">Order completed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentOrder.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Order Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{currentOrder.notes}</p>
                  </div>
                )}

                {/* Business Contact */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Need Help?</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{portalData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{portalData.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Product selection view - only show if no order placed yet */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Products */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Products Available
                </CardTitle>
                <CardDescription>
                  Select products to add to your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-xs text-gray-500 mt-1">{product.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">Rs. {(product.price || 0).toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              disabled={(product.stock_quantity || 0) === 0}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add to Cart
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products available at the moment.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart and Order History */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Shopping Cart */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Order ({cart.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 pr-2">
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs text-gray-600">Rs. {(item.unit_price || 0).toFixed(2)} each</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="text-sm font-semibold">Rs. {(item.total_price || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">Rs. {(calculateTotal() || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{portalData.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{portalData.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{portalData.email}</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
        )}
      </div>

      {/* Floating Cart Button for Mobile - only show if order not yet placed */}
      {!hasPlacedOrder && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg lg:hidden z-40">
          <Button
            onClick={() => setIsOrderDialogOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Place Order ({cart.length} items) - Rs. {(calculateTotal() || 0).toFixed(2)}
          </Button>
        </div>
      )}

      {/* Place Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Place Your Order</DialogTitle>
            <DialogDescription>
              Review your order and provide delivery information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Order Summary</h4>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-sm">{item.product_name} x {item.quantity}</span>
                    <span className="text-sm font-medium">Rs. {(item.total_price || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total:</span>
                    <span>Rs. {(calculateTotal() || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h4 className="font-semibold">Delivery Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Contact Person <span className="text-red-500">*</span></Label>
                  <Input
                    id="customer_name"
                    value={orderForm.customer_name}
                    onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={orderForm.customer_email}
                    onChange={(e) => setOrderForm({...orderForm, customer_email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone Number</Label>
                <Input
                  id="customer_phone"
                  value={orderForm.customer_phone}
                  onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="delivery_address">Delivery Address <span className="text-red-500">*</span></Label>
                <Textarea
                  id="delivery_address"
                  value={orderForm.delivery_address}
                  onChange={(e) => setOrderForm({...orderForm, delivery_address: e.target.value})}
                  placeholder="Enter delivery address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea
                  id="notes"
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  placeholder="Any special instructions or notes"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsOrderDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full sm:w-auto" onClick={handlePlaceOrder}>
                Place Order - Rs. {(calculateTotal() || 0).toFixed(2)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPortal;
