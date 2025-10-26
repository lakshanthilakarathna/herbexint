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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Plus, Search, Filter, Eye, Edit, Trash2, MapPin, Clock, Camera, CheckCircle, XCircle, AlertCircle, Calendar, User, Target, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLocationWithFallback, LocationData, showMobileLocationInstructions, checkLocationCompatibility } from '@/lib/locationUtils';

interface Visit {
  id: string;
  customer_id: string;
  customer_name: string;
  sales_rep_id: string;
  sales_rep_name: string;
  check_in_time: string;
  check_out_time?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  purpose: 'sales_call' | 'delivery' | 'follow_up' | 'other';
  outcome: 'successful' | 'needs_follow_up' | 'no_contact' | 'other';
  notes: string;
  photos: string[]; // Base64 or URLs
  order_id?: string; // Linked order
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const Visits: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('30'); // days
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [newVisit, setNewVisit] = useState<Partial<Visit>>({
    customer_id: '',
    purpose: 'sales_call',
    outcome: 'successful',
    notes: '',
    photos: []
  });
  const [editVisit, setEditVisit] = useState<Partial<Visit>>({});
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<{latitude: number, longitude: number, address?: string} | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  useEffect(() => {
    fetchVisits();
    fetchCustomers();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getVisits();
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load visits from database');
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiClient.getCustomers();
      const formattedCustomers = Array.isArray(data) ? data.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone
      })) : [];
      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  // Location capture is now handled by the utility function

  const captureLocation = async () => {
    try {
      setIsCapturingLocation(true);
      
      console.log('🌍 Attempting to get location for visit tracking...');
      const location = await getLocationWithFallback();
      
      if (location) {
        setLocationData(location);
        toast.success(`Location captured: ${location.address}`, { duration: 3000 });
        console.log('✅ Location data captured:', location);
      } else {
        throw new Error('Location is required to create visits');
      }
    } catch (error) {
      console.error('❌ Location capture failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Location is required to create visits';
      toast.error('Location is required to create visits. Please enable location access and try again.', { 
        duration: 10000,
        description: errorMessage
      });
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedPhotos.length > 3) {
      toast.error('Maximum 3 photos allowed');
      return;
    }

    const newFiles = [...selectedPhotos, ...files];
    setSelectedPhotos(newFiles);

    // Create previews
    const newPreviews: string[] = [];
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === newFiles.length) {
          setPhotoPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const newFiles = selectedPhotos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setSelectedPhotos(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const handleCreateVisit = async () => {
    try {
      if (!newVisit.customer_id) {
        toast.error('Please select a customer');
        return;
      }

      if (!locationData) {
        toast.error('Please capture your location first');
        return;
      }

      const customer = customers.find(c => c.id === newVisit.customer_id);
      if (!customer) {
        toast.error('Customer not found');
        return;
      }

      // Convert photos to base64
      const photoBase64s: string[] = [];
      for (const file of selectedPhotos) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        photoBase64s.push(base64);
      }

      const visitData: Visit = {
        id: 'visit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        customer_id: newVisit.customer_id,
        customer_name: customer.name,
        sales_rep_id: user?.id || 'system',
        sales_rep_name: user?.name || 'Unknown',
        check_in_time: new Date().toISOString(),
        location: locationData,
        purpose: newVisit.purpose || 'sales_call',
        outcome: newVisit.outcome || 'successful',
        notes: newVisit.notes || '',
        photos: photoBase64s,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const created = await apiClient.createVisit(visitData);
      setVisits([created, ...visits]);
      setIsCreateDialogOpen(false);
      
      // Reset form
      setNewVisit({
        customer_id: '',
        purpose: 'sales_call',
        outcome: 'successful',
        notes: '',
        photos: []
      });
      setSelectedPhotos([]);
      setPhotoPreviews([]);
      setLocationData(null);
      
      toast.success('Visit created successfully!');
    } catch (error) {
      console.error('Error creating visit:', error);
      toast.error('Failed to create visit');
    }
  };

  const handleViewVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsViewDialogOpen(true);
  };

  const handleEditVisit = (visit: Visit) => {
    setEditVisit({...visit});
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editVisit.id) return;
      
      const updated = await apiClient.updateVisit(editVisit.id, editVisit);
      
      const updatedVisits = visits.map(v => 
        v.id === editVisit.id ? updated : v
      );
      setVisits(updatedVisits);
      setIsEditDialogOpen(false);
      setEditVisit({});
      toast.success('Visit updated successfully!');
    } catch (error) {
      toast.error('Failed to update visit');
      console.error('Error updating visit:', error);
    }
  };

  const handleCheckOut = async (visitId: string) => {
    try {
      const updated = await apiClient.updateVisit(visitId, {
        check_out_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const updatedVisits = visits.map(v => 
        v.id === visitId ? updated : v
      );
      setVisits(updatedVisits);
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error('Failed to check out');
      console.error('Error checking out:', error);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    try {
      await apiClient.deleteVisit(visitId);
      setVisits(visits.filter(v => v.id !== visitId));
      toast.success('Visit deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete visit');
      console.error('Error deleting visit:', error);
    }
  };

  const getPurposeBadge = (purpose: Visit['purpose']) => {
    const purposeConfig = {
      sales_call: { color: 'bg-blue-100 text-blue-800', label: 'Sales Call' },
      delivery: { color: 'bg-green-100 text-green-800', label: 'Delivery' },
      follow_up: { color: 'bg-yellow-100 text-yellow-800', label: 'Follow-up' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Other' }
    };
    
    const config = purposeConfig[purpose];
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getOutcomeBadge = (outcome: Visit['outcome']) => {
    const outcomeConfig = {
      successful: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Successful' },
      needs_follow_up: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Needs Follow-up' },
      no_contact: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'No Contact' },
      other: { color: 'bg-gray-100 text-gray-800', icon: Target, label: 'Other' }
    };
    
    const config = outcomeConfig[outcome];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getDuration = (visit: Visit) => {
    if (!visit.check_out_time) return 'In Progress';
    
    const checkIn = new Date(visit.check_in_time);
    const checkOut = new Date(visit.check_out_time);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPurpose = purposeFilter === 'all' || visit.purpose === purposeFilter;
    const matchesOutcome = outcomeFilter === 'all' || visit.outcome === outcomeFilter;
    
    // Date filter
    const visitDate = new Date(visit.check_in_time);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
    const matchesDate = daysDiff <= parseInt(dateFilter);
    
    // User filter (sales reps see only their own, admin sees all)
    const isAdmin = user?.role_id === 'admin-role-id';
    const matchesUser = isAdmin || visit.sales_rep_id === user?.id;
    
    return matchesSearch && matchesPurpose && matchesOutcome && matchesDate && matchesUser;
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
        {hasPermission('visits:write') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Check In to Visit</DialogTitle>
                <DialogDescription>
                  Log a new customer visit with location and notes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Location Capture */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-blue-900 font-medium">Location</Label>
                      <p className="text-sm text-blue-700">
                        {locationData ? locationData.address : 'Location not captured'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={captureLocation}
                      disabled={isCapturingLocation}
                    >
                      {isCapturingLocation ? (
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4 mr-2" />
                      )}
                      {isCapturingLocation ? 'Capturing...' : 'Capture Location'}
                    </Button>
                  </div>
                </div>

                {/* Customer Selection */}
                <div>
                  <Label htmlFor="customer">Customer <span className="text-red-500">*</span></Label>
                  <Select value={newVisit.customer_id} onValueChange={(value) => setNewVisit({...newVisit, customer_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Purpose and Outcome */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purpose">Purpose <span className="text-red-500">*</span></Label>
                    <Select value={newVisit.purpose} onValueChange={(value: any) => setNewVisit({...newVisit, purpose: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales_call">Sales Call</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="outcome">Outcome <span className="text-red-500">*</span></Label>
                    <Select value={newVisit.outcome} onValueChange={(value: any) => setNewVisit({...newVisit, outcome: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="successful">Successful</SelectItem>
                        <SelectItem value="needs_follow_up">Needs Follow-up</SelectItem>
                        <SelectItem value="no_contact">No Contact</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newVisit.notes || ''}
                    onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                    placeholder="Add visit notes..."
                    rows={3}
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <Label>Photos (Optional, max 3)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <div className="text-center">
                        <Camera className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Click to upload photos</p>
                      </div>
                    </label>
                    
                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {photoPreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removePhoto(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVisit} disabled={!locationData}>
                    Check In
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
              <CardTitle>Visit Tracking</CardTitle>
              <CardDescription>
                Track sales representative visits to customers
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search visits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purposes</SelectItem>
                  <SelectItem value="sales_call">Sales Call</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="needs_follow_up">Needs Follow-up</SelectItem>
                  <SelectItem value="no_contact">No Contact</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile View - Card Layout */}
          <div className="block lg:hidden space-y-3">
            {filteredVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No visits found matching your criteria.
              </div>
            ) : (
              filteredVisits.map((visit) => (
                <Card key={visit.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{visit.customer_name}</h3>
                        <div className="flex gap-2 mt-1">
                          {getPurposeBadge(visit.purpose)}
                          {getOutcomeBadge(visit.outcome)}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{new Date(visit.check_in_time).toLocaleDateString()}</div>
                        <div>{new Date(visit.check_in_time).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{visit.sales_rep_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{getDuration(visit)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{visit.location.address}</span>
                      </div>
                      {visit.notes && (
                        <div className="text-gray-600">
                          <span className="font-medium">Notes:</span> {visit.notes}
                        </div>
                      )}
                      {visit.photos.length > 0 && (
                        <div className="flex items-center text-gray-600">
                          <Camera className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{visit.photos.length} photo(s)</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewVisit(visit)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {hasPermission('visits:write') && visit.sales_rep_id === user?.id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditVisit(visit)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {!visit.check_out_time && visit.sales_rep_id === user?.id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCheckOut(visit.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Check Out
                        </Button>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">{visit.customer_name}</TableCell>
                    <TableCell>{visit.sales_rep_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(visit.check_in_time).toLocaleDateString()}</div>
                        <div className="text-gray-500">{new Date(visit.check_in_time).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getDuration(visit)}</TableCell>
                    <TableCell>{getPurposeBadge(visit.purpose)}</TableCell>
                    <TableCell>{getOutcomeBadge(visit.outcome)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[150px]">{visit.location.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewVisit(visit)}
                          title="View Visit Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {hasPermission('visits:write') && visit.sales_rep_id === user?.id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditVisit(visit)}
                            title="Edit Visit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {!visit.check_out_time && visit.sales_rep_id === user?.id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCheckOut(visit.id)}
                            title="Check Out"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('visits:delete') && visit.sales_rep_id === user?.id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteVisit(visit.id)}
                            title="Delete Visit"
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
          {filteredVisits.length === 0 && (
            <div className="hidden lg:block text-center py-8 text-gray-500">
              No visits found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Visit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Visit Details</DialogTitle>
            <DialogDescription>
              View detailed visit information
            </DialogDescription>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Visit Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Customer</label>
                      <p className="font-medium">{selectedVisit.customer_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Sales Representative</label>
                      <p className="font-medium">{selectedVisit.sales_rep_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Purpose</label>
                      <div className="mt-1">{getPurposeBadge(selectedVisit.purpose)}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Outcome</label>
                      <div className="mt-1">{getOutcomeBadge(selectedVisit.outcome)}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Timing</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Check In</label>
                      <p className="font-medium">{new Date(selectedVisit.check_in_time).toLocaleString()}</p>
                    </div>
                    {selectedVisit.check_out_time && (
                      <div>
                        <label className="text-xs text-gray-500">Check Out</label>
                        <p className="font-medium">{new Date(selectedVisit.check_out_time).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500">Duration</label>
                      <p className="font-medium">{getDuration(selectedVisit)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">Location</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800">{selectedVisit.location.address}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        📍 {selectedVisit.location.latitude.toFixed(6)}, {selectedVisit.location.longitude.toFixed(6)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${selectedVisit.location.latitude},${selectedVisit.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {selectedVisit.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Notes</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedVisit.notes}</p>
                </div>
              )}

              {selectedVisit.photos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedVisit.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Visit photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {hasPermission('visits:write') && selectedVisit.sales_rep_id === user?.id && (
                  <Button onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditVisit(selectedVisit);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Visit
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Visit</DialogTitle>
            <DialogDescription>
              Update visit information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_purpose">Purpose</Label>
                <Select value={editVisit.purpose} onValueChange={(value: any) => setEditVisit({...editVisit, purpose: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_call">Sales Call</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_outcome">Outcome</Label>
                <Select value={editVisit.outcome} onValueChange={(value: any) => setEditVisit({...editVisit, outcome: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="needs_follow_up">Needs Follow-up</SelectItem>
                    <SelectItem value="no_contact">No Contact</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={editVisit.notes || ''}
                onChange={(e) => setEditVisit({...editVisit, notes: e.target.value})}
                placeholder="Add visit notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditVisit({});
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

export default Visits;
