import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Search, Package, CheckCircle, Clock, Eye, Truck, MapPin } from 'lucide-react';
import { DeliveryConfirmation } from '@/components/DeliveryConfirmation';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'shipped' | 'delivered';
  items: any[];
  assigned_to?: string;
  delivery_confirmation?: any;
  order_date: string;
}

const Deliveries: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('shipped'); // Show shipped (ready for delivery)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getOrders();
      
      // Filter orders assigned to current delivery person
      const myOrders = data.filter((order: Order) => {
        const isAssigned = order.assigned_to === user?.id;
        const isShippedOrDelivered = order.status === 'shipped' || order.status === 'delivered';
        return isAssigned && isShippedOrDelivered;
      });
      setOrders(myOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (confirmation: any) => {
    if (!selectedOrder) return;

    try {
      // Update order status to delivered and add confirmation
      await apiClient.updateOrder(selectedOrder.id, {
        status: 'delivered',
        delivery_confirmation: confirmation,
        updated_at: new Date().toISOString()
      });

      toast.success('Delivery confirmed successfully!');
      await fetchOrders();
      setIsConfirmDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'shipped') {
      return <Badge className="bg-blue-100 text-blue-800"><Truck className="w-3 h-3 mr-1" />Ready for Delivery</Badge>;
    }
    if (status === 'delivered') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
        <p className="text-sm text-gray-600 mt-1">View and manage your assigned delivery orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Delivery</CardDescription>
            <CardTitle className="text-3xl">
              {orders.filter(o => o.status === 'shipped').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {orders.filter(o => o.status === 'delivered').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Your assigned delivery orders</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders assigned yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Ask your admin to assign orders to you from the Orders page
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium font-mono">{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>Rs. {order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsConfirmDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order {selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Customer: {selectedOrder.customer_name}</h3>
                <p className="text-sm text-gray-600">Order Date: {new Date(selectedOrder.order_date).toLocaleString()}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-2 border rounded">
                      <span>{item.product_name}</span>
                      <span>Qty: {item.quantity} × Rs. {item.unit_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between font-semibold text-lg pt-4 border-t">
                <span>Total:</span>
                <span>Rs. {selectedOrder.total_amount.toFixed(2)}</span>
              </div>

              {selectedOrder.delivery_confirmation && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Delivery Confirmed</h4>
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

      {/* Confirmation Dialog */}
      {selectedOrder && (
        <DeliveryConfirmation
          open={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={handleConfirmDelivery}
          orderNumber={selectedOrder.order_number}
        />
      )}
    </div>
  );
};

export default Deliveries;
