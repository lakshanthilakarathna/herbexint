import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Plus, Search, Filter, Eye, Edit, Trash2, MapPin, Phone, Mail, Building, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';

interface Customer {
  id: string;
  name: string;
  type: 'bar' | 'restaurant' | 'liquor_store' | 'other';
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact_person: string;
  contact_title: string;
  status: 'active' | 'inactive' | 'suspended';
  credit_limit: number;
  payment_terms: string;
  territory_id: string;
  created_at: string;
  updated_at: string;
}

const Customers: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Partial<Customer>>({});
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    type: 'bar',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    contact_person: '',
    contact_title: '',
    status: 'active',
    credit_limit: 0,
    payment_terms: 'Net 30',
    territory_id: user?.territory_id || ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Fetch from backend API
      const data = await apiClient.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers from database');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      // Validation
      if (!newCustomer.name || newCustomer.name.trim() === '') {
        toast.error('Customer name is required');
        return;
      }
      
      // Email format validation (optional, but if provided must be valid)
      if (newCustomer.email && newCustomer.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newCustomer.email)) {
          toast.error('Please enter a valid email address');
          return;
        }
      }
      
      if (!newCustomer.phone || newCustomer.phone.trim() === '') {
        toast.error('Phone number is required');
        return;
      }

      // Generate ID (fallback if crypto.randomUUID is not available)
      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      };

      const customerData: Customer = {
        id: generateId(),
        name: newCustomer.name || '',
        type: newCustomer.type || 'bar',
        email: newCustomer.email || '',
        phone: newCustomer.phone || '',
        address: newCustomer.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        contact_person: newCustomer.contact_person || '',
        contact_title: newCustomer.contact_title || '',
        status: 'active',
        credit_limit: newCustomer.credit_limit || 0,
        payment_terms: newCustomer.payment_terms || 'Net 30',
        territory_id: newCustomer.territory_id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save to backend API
      const created = await apiClient.createCustomer(customerData);
      
      // Update local state
      setCustomers([created, ...customers]);
      setIsCreateDialogOpen(false);
      setNewCustomer({
        name: '',
        type: 'bar',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        contact_person: '',
        contact_title: '',
        status: 'active',
        credit_limit: 0,
        payment_terms: 'Net 30',
        territory_id: user?.territory_id || ''
      });
      toast.success('Customer created successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('Error creating customer:', error);
      toast.error(`Failed to create customer: ${errorMessage}`);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditCustomer({...customer});
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editCustomer.id) return;
      
      // Update in backend API
      const updated = await apiClient.updateCustomer(editCustomer.id, editCustomer);
      
      // Update local state
      const updatedCustomers = customers.map(c => 
        c.id === editCustomer.id ? updated : c
      );
      setCustomers(updatedCustomers);
      setIsEditDialogOpen(false);
      setEditCustomer({});
      toast.success('Customer updated in database!');
    } catch (error) {
      toast.error('Failed to update customer in database');
      console.error('Error updating customer:', error);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      // Delete from backend API
      await apiClient.deleteCustomer(customerId);
      
      // Update local state
      const updatedCustomers = customers.filter(customer => customer.id !== customerId);
      setCustomers(updatedCustomers);
      toast.success('Customer deleted from database!');
    } catch (error) {
      toast.error('Failed to delete customer from database');
      console.error('Error deleting customer:', error);
    }
  };

  const getTypeBadge = (type: Customer['type']) => {
    const typeConfig = {
      bar: { color: 'bg-blue-100 text-blue-800', label: 'Bar' },
      restaurant: { color: 'bg-green-100 text-green-800', label: 'Restaurant' },
      liquor_store: { color: 'bg-purple-100 text-purple-800', label: 'Liquor Store' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Other' }
    };
    
    // Safety check for undefined/null type
    if (!type || typeof type !== 'string') {
      type = 'other'; // Default to 'other'
    }
    
    const config = typeConfig[type] || typeConfig.other;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: Customer['status']) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' }
    };
    
    // Safety check for undefined/null status
    if (!status || typeof status !== 'string') {
      status = 'active'; // Default to 'active'
    }
    
    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || customer.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
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
        {user?.role_id === 'admin-role-id' && (
          <Button variant="outline" onClick={() => navigate('/customer-portals')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Customer Portals
          </Button>
        )}
        {hasPermission('customers:write') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a new customer profile
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Customer Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={newCustomer.name || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">Customer Type</Label>
                    <Select value={newCustomer.type} onValueChange={(value: any) => setNewCustomer({...newCustomer, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="liquor_store">Liquor Store</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="Enter email address (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="street">Address</Label>
                  <Input
                    id="street"
                    value={newCustomer.address?.street || ''}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer, 
                      address: {
                        street: e.target.value,
                        city: newCustomer.address?.city || '',
                        state: newCustomer.address?.state || '',
                        zipCode: newCustomer.address?.zipCode || '',
                        country: newCustomer.address?.country || 'USA'
                      }
                    })}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newCustomer.address?.city || ''}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer, 
                        address: {
                          street: newCustomer.address?.street || '',
                          city: e.target.value,
                          state: newCustomer.address?.state || '',
                          zipCode: newCustomer.address?.zipCode || '',
                          country: newCustomer.address?.country || 'USA'
                        }
                      })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={newCustomer.address?.state || ''}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer, 
                        address: {
                          street: newCustomer.address?.street || '',
                          city: newCustomer.address?.city || '',
                          state: e.target.value,
                          zipCode: newCustomer.address?.zipCode || '',
                          country: newCustomer.address?.country || 'USA'
                        }
                      })}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={newCustomer.address?.zipCode || ''}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer, 
                        address: {
                          street: newCustomer.address?.street || '',
                          city: newCustomer.address?.city || '',
                          state: newCustomer.address?.state || '',
                          zipCode: e.target.value,
                          country: newCustomer.address?.country || 'USA'
                        }
                      })}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={newCustomer.contact_person || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, contact_person: e.target.value})}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_title">Contact Title</Label>
                    <Input
                      id="contact_title"
                      value={newCustomer.contact_title || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, contact_title: e.target.value})}
                      placeholder="Contact person title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credit_limit">Credit Limit (LKR)</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      value={newCustomer.credit_limit || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, credit_limit: Number(e.target.value)})}
                      placeholder="Enter amount in LKR"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select value={newCustomer.payment_terms} onValueChange={(value) => setNewCustomer({...newCustomer, payment_terms: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCustomer}>
                    Create Customer
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
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                View and manage all customer profiles
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="liquor_store">Liquor Store</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile View - Card Layout */}
          <div className="block md:hidden space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No customers found matching your criteria.
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <Card key={customer.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <div className="flex gap-2 mt-1">
                          {getTypeBadge(customer.type)}
                          {getStatusBadge(customer.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{customer.contact_person} ({customer.contact_title})</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{customer.address.city}, {customer.address.state}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-gray-500">Credit Limit:</span>
                        <span className="font-semibold">Rs. {(customer.credit_limit || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {hasPermission('customers:write') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {hasPermission('customers:delete') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[100px]">Type</TableHead>
                <TableHead className="min-w-[180px]">Contact</TableHead>
                <TableHead className="min-w-[150px]">Address</TableHead>
                <TableHead className="min-w-[80px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Credit Limit</TableHead>
                <TableHead className="min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{getTypeBadge(customer.type)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-1" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-3 h-3 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-3 h-3 mr-1" />
                      {customer.address.city}, {customer.address.state}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>Rs. {(customer.credit_limit || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                        title="View Customer Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission('customers:write') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('customers:delete') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {filteredCustomers.length === 0 && (
            <div className="hidden md:block text-center py-8 text-gray-500">
              No customers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View detailed customer information
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Customer Name</label>
                      <p className="font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Type</label>
                      <p className="font-medium capitalize">{selectedCustomer.type}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedCustomer.status)}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">Address</h4>
                <p className="text-sm">{selectedCustomer.address.street}</p>
                <p className="text-sm">
                  {selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zipCode}
                </p>
                <p className="text-sm">{selectedCustomer.address.country}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Contact Person</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Name</label>
                      <p className="font-medium">{selectedCustomer.contact_person}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Title</label>
                      <p className="font-medium">{selectedCustomer.contact_title}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Financial Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Credit Limit</label>
                      <p className="font-medium">Rs. {(selectedCustomer.credit_limit || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Payment Terms</label>
                      <p className="font-medium">{selectedCustomer.payment_terms}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {hasPermission('customers:delete') && (
                  <Button 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      handleDeleteCustomer(selectedCustomer.id);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
                {hasPermission('customers:write') && (
                  <Button onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditCustomer(selectedCustomer);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Customer Name *</Label>
                <Input
                  id="edit_name"
                  value={editCustomer.name || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_type">Customer Type</Label>
                <Select value={editCustomer.type} onValueChange={(value: any) => setEditCustomer({...editCustomer, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="liquor_store">Liquor Store</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editCustomer.email || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                  placeholder="Enter email address (optional)"
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">Phone *</Label>
                <Input
                  id="edit_phone"
                  value={editCustomer.phone || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_contact_person">Contact Person</Label>
                <Input
                  id="edit_contact_person"
                  value={editCustomer.contact_person || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, contact_person: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_contact_title">Contact Title</Label>
                <Input
                  id="edit_contact_title"
                  value={editCustomer.contact_title || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, contact_title: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_credit_limit">Credit Limit (LKR)</Label>
                <Input
                  id="edit_credit_limit"
                  type="number"
                  value={editCustomer.credit_limit || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, credit_limit: Number(e.target.value)})}
                  placeholder="Enter amount in LKR"
                />
              </div>
              <div>
                <Label htmlFor="edit_payment_terms">Payment Terms</Label>
                <Select value={editCustomer.payment_terms} onValueChange={(value) => setEditCustomer({...editCustomer, payment_terms: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditCustomer({});
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
