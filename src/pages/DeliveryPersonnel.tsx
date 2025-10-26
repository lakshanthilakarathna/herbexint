import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Plus, Search, Eye, Edit, Trash2, User, CheckCircle, XCircle } from 'lucide-react';

interface DeliveryPerson {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  vehicle_number?: string;
  license_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const DeliveryPersonnel: React.FC = () => {
  const { user } = useAuth();
  const [personnel, setPersonnel] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<DeliveryPerson | null>(null);
  const [newPerson, setNewPerson] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicle_number: '',
    license_number: ''
  });

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const users = await apiClient.getUsers();
      
      // Filter for delivery personnel
      const deliveryUsers = users.filter((u: any) => 
        u.role_name === 'Delivery Personnel' || u.role_id === 'delivery-role-id'
      );
      
      setPersonnel(deliveryUsers);
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      toast.error('Failed to load delivery personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async () => {
    try {
      // Validation
      if (!newPerson.name || !newPerson.username || !newPerson.password) {
        toast.error('Name, username, and password are required');
        return;
      }

      if (newPerson.password !== newPerson.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newPerson.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      // Check if username already exists
      if (personnel.find(p => p.username === newPerson.username)) {
        toast.error('Username already exists');
        return;
      }

      const deliveryPerson: any = {
        id: 'delivery-' + Date.now(),
        name: newPerson.name,
        username: newPerson.username,
        email: newPerson.email || `${newPerson.username}@herb.com`,
        phone: newPerson.phone,
        vehicle_number: newPerson.vehicle_number,
        license_number: newPerson.license_number,
        password: newPerson.password,
        role_id: 'delivery-role-id',
        role_name: 'Delivery Personnel',
        permissions: [
          'orders:read',
          'deliveries:read',
          'deliveries:write'
        ],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await apiClient.createUser(deliveryPerson);
      await fetchPersonnel();
      
      setIsCreateDialogOpen(false);
      setNewPerson({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        vehicle_number: '',
        license_number: ''
      });
      
      toast.success(`Delivery personnel ${newPerson.name} created successfully!`);
    } catch (error) {
      toast.error('Failed to create delivery personnel');
      console.error('Error creating delivery personnel:', error);
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (!confirm('Are you sure you want to delete this delivery personnel?')) {
      return;
    }

    try {
      await apiClient.deleteUser(personId);
      await fetchPersonnel();
      toast.success('Delivery personnel deleted successfully');
    } catch (error) {
      toast.error('Failed to delete delivery personnel');
      console.error('Error deleting:', error);
    }
  };

  const handleViewPerson = (person: DeliveryPerson) => {
    setSelectedPerson(person);
    setIsViewDialogOpen(true);
  };

  const filteredPersonnel = personnel.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Personnel</h1>
          <p className="text-sm text-gray-600 mt-1">Manage delivery staff and their assignments</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Delivery Personnel</DialogTitle>
              <DialogDescription>
                Create a new delivery person account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({...newPerson, name: e.target.value})}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                  <Input
                    id="username"
                    value={newPerson.username}
                    onChange={(e) => setNewPerson({...newPerson, username: e.target.value})}
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({...newPerson, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({...newPerson, phone: e.target.value})}
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle">Vehicle Number</Label>
                  <Input
                    id="vehicle"
                    value={newPerson.vehicle_number}
                    onChange={(e) => setNewPerson({...newPerson, vehicle_number: e.target.value})}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={newPerson.license_number}
                    onChange={(e) => setNewPerson({...newPerson, license_number: e.target.value})}
                    placeholder="License number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPerson.password}
                    onChange={(e) => setNewPerson({...newPerson, password: e.target.value})}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newPerson.confirmPassword}
                    onChange={(e) => setNewPerson({...newPerson, confirmPassword: e.target.value})}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePerson}>
                  Create Personnel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Delivery Staff</CardTitle>
              <CardDescription>Manage delivery personnel accounts</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search personnel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPersonnel.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No delivery personnel found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell className="font-mono text-sm">{person.username}</TableCell>
                      <TableCell>{person.phone}</TableCell>
                      <TableCell>{person.vehicle_number || 'N/A'}</TableCell>
                      <TableCell>
                        {person.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPerson(person)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePerson(person.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery Personnel Details</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{selectedPerson.name}</h3>
                <p className="text-sm text-gray-600">Username: {selectedPerson.username}</p>
              </div>
              <div>
                <p className="text-sm"><strong>Email:</strong> {selectedPerson.email}</p>
                <p className="text-sm"><strong>Phone:</strong> {selectedPerson.phone}</p>
                <p className="text-sm"><strong>Vehicle:</strong> {selectedPerson.vehicle_number || 'N/A'}</p>
                <p className="text-sm"><strong>License:</strong> {selectedPerson.license_number || 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryPersonnel;
