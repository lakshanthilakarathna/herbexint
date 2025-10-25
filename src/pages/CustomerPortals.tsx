import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Plus, Search, Eye, Edit, Trash2, Copy, ExternalLink, Users, Calendar, Link } from 'lucide-react';

interface CustomerPortal {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  unique_url: string;
  status: 'active' | 'inactive';
  total_orders: number;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const CustomerPortals: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [portals, setPortals] = useState<CustomerPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<CustomerPortal | null>(null);
  const [newPortal, setNewPortal] = useState<Partial<CustomerPortal>>({
    business_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'active'
  });

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      setLoading(true);
      // Load from API only (no localStorage)
      const data = await apiClient.getCustomerPortals();
      setPortals(Array.isArray(data) ? data : []);
      console.log('Loaded customer portals from database:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching customer portals:', error);
      toast.error('Failed to load customer portals');
      setPortals([]);
    } finally {
      setLoading(false);
    }
  };

  const generateUniqueUrl = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `customer-portal-${timestamp}-${random}`;
  };

  const handleCreatePortal = async () => {
    try {
      if (!newPortal.business_name || !newPortal.contact_person || !newPortal.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      const portalData: CustomerPortal = {
        id: String(Date.now()),
        business_name: newPortal.business_name || '',
        contact_person: newPortal.contact_person || '',
        phone: newPortal.phone || '',
        email: newPortal.email || '',
        address: newPortal.address || '',
        unique_url: generateUniqueUrl(),
        status: 'active',
        total_orders: 0,
        total_amount: 0,
        created_by: user?.id || 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database via API
      console.log('Attempting to save portal to database:', portalData);
      const created = await apiClient.createCustomerPortal(portalData);
      console.log('Portal saved to database successfully:', created);
      setPortals([created, ...portals]);
      
      setIsCreateDialogOpen(false);
      setNewPortal({
        business_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        status: 'active'
      });
      
      const fullUrl = `${window.location.origin}/customer-portal/${portalData.unique_url}`;
      toast.success(
        <div>
          <p className="font-semibold">Customer portal created!</p>
          <p className="text-xs mt-1">Send this URL to your customer:</p>
          <p className="text-xs font-mono mt-1 bg-gray-100 p-1 rounded break-all">{fullUrl}</p>
        </div>,
        { duration: 8000 }
      );
    } catch (error) {
      toast.error('Failed to create customer portal');
      console.error('Error creating portal:', error);
    }
  };

  const handleViewPortal = (portal: CustomerPortal) => {
    setSelectedPortal(portal);
    setIsViewDialogOpen(true);
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = `${window.location.origin}/customer-portal/${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success('Customer portal URL copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy URL');
    });
  };

  const handleToggleStatus = async (portalId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // Update via API
      await apiClient.updateCustomerPortal(portalId, { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      });
      console.log('Portal status updated in database');
      
      const updatedPortals = portals.map(portal => 
        portal.id === portalId 
          ? { ...portal, status: newStatus as 'active' | 'inactive', updated_at: new Date().toISOString() }
          : portal
      );
      
      setPortals(updatedPortals);
      toast.success(`Portal ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update portal status');
      console.error('Error updating portal:', error);
    }
  };

  const handleDeletePortal = async (portalId: string) => {
    if (!confirm('Are you sure you want to delete this customer portal? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete via API
      await apiClient.deleteCustomerPortal(portalId);
      console.log('Portal deleted from database');
      
      const updatedPortals = portals.filter(portal => portal.id !== portalId);
      setPortals(updatedPortals);
      
      toast.success('Customer portal deleted successfully');
    } catch (error) {
      console.error('Failed to delete portal:', error);
      toast.error('Failed to delete customer portal');
    }
  };

  const getStatusBadge = (status: CustomerPortal['status']) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  const filteredPortals = portals.filter(portal => {
    const matchesSearch = portal.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portal.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portal.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
        {(
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Customer Portal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Create Customer Portal</DialogTitle>
                <DialogDescription>
                  Create a unique URL for a customer to place orders directly
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_name">Business Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="business_name"
                      value={newPortal.business_name || ''}
                      onChange={(e) => setNewPortal({...newPortal, business_name: e.target.value})}
                      placeholder="Enter business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact_person"
                      value={newPortal.contact_person || ''}
                      onChange={(e) => setNewPortal({...newPortal, contact_person: e.target.value})}
                      placeholder="Enter contact person name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newPortal.phone || ''}
                      onChange={(e) => setNewPortal({...newPortal, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPortal.email || ''}
                      onChange={(e) => setNewPortal({...newPortal, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    value={newPortal.address || ''}
                    onChange={(e) => setNewPortal({...newPortal, address: e.target.value})}
                    placeholder="Enter business address"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewPortal({
                      business_name: '',
                      contact_person: '',
                      phone: '',
                      email: '',
                      address: '',
                      status: 'active'
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button className="w-full sm:w-auto" onClick={handleCreatePortal}>
                    Create Portal
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
              <CardTitle>Customer Portals</CardTitle>
              <CardDescription>
                Manage customer portals for direct ordering
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search portals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPortals.map((portal) => (
                <TableRow key={portal.id}>
                  <TableCell className="font-medium">{portal.business_name}</TableCell>
                  <TableCell>{portal.contact_person}</TableCell>
                  <TableCell>{portal.email}</TableCell>
                  <TableCell>{getStatusBadge(portal.status)}</TableCell>
                  <TableCell>{portal.total_orders || 0}</TableCell>
                  <TableCell>Rs. {(portal.total_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{new Date(portal.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPortal(portal)}
                        title="View Portal Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyUrl(portal.unique_url)}
                        title="Copy Customer URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/customer-portal/${portal.unique_url}`, '_blank')}
                        title="Open Customer Portal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {(
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleStatus(portal.id, portal.status)}
                          title={portal.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={portal.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {portal.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                      {(
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeletePortal(portal.id)}
                          title="Delete Portal"
                          className="text-red-600 hover:text-red-700"
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
          {filteredPortals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customer portals found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Portal Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Customer Portal Details</DialogTitle>
            <DialogDescription>
              View complete portal information and customer URL
            </DialogDescription>
          </DialogHeader>
          {selectedPortal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <p className="font-medium">{selectedPortal.business_name}</p>
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <p className="font-medium">{selectedPortal.contact_person}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedPortal.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="font-medium">{selectedPortal.phone || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <Label>Business Address</Label>
                <p className="font-medium">{selectedPortal.address || 'Not provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedPortal.status)}</div>
                </div>
                <div>
                  <Label>Created Date</Label>
                  <p className="font-medium">{new Date(selectedPortal.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Orders</Label>
                  <p className="font-medium">{selectedPortal.total_orders || 0}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium">Rs. {(selectedPortal.total_amount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Link className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-blue-900">Customer Portal URL</Label>
                    <p className="text-sm text-blue-800 mt-1 font-mono break-all">
                      {window.location.origin}/customer-portal/{selectedPortal.unique_url}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Send this URL to your customer to allow them to place orders directly.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleCopyUrl(selectedPortal.unique_url)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/customer-portal/${selectedPortal.unique_url}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Portal
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPortals;
