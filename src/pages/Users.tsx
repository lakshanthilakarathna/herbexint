import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Plus, Search, Eye, Edit, Trash2, UserPlus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role_id: string;
  role_name: string;
  password?: string;
  permissions: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

const Users: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'sales-rep' // Default role
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Load users from database
      const dbUsers = await apiClient.getUsers();
      const usersFromDb = Array.isArray(dbUsers) ? dbUsers : [];
      
      // Include default users (Admin + 2 Sales Representatives)
      const defaultUsers: User[] = [
        {
          id: 'admin-user-id',
          name: 'Admin User',
          email: 'admin@herb.com',
          role_id: 'admin-role-id',
          role_name: 'System Administrator',
          permissions: [
            'orders:read', 'orders:write', 'orders:delete',
            'customers:read', 'customers:write', 'customers:delete',
            'products:read', 'products:write', 'products:delete',
            'visits:read', 'visits:write', 'visits:delete',
            'reports:read', 'reports:write',
            'users:read', 'users:write', 'users:delete',
            'audit:read'
          ],
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 'sales-rep-1',
          name: 'Sales Rep 1',
          username: 'sales1',
          email: 'sales1@herb.com',
          phone: '+94 77 111 2222',
          role_id: 'sales-rep-role-id',
          role_name: 'Sales Representative',
          permissions: [
            'orders:read', 'orders:write',
            'customers:read', 'customers:write',
            'products:read',
            'visits:read', 'visits:write', 'visits:delete'
          ],
          status: 'active',
          created_at: '2025-10-01T00:00:00Z',
          updated_at: '2025-10-01T00:00:00Z'
        }
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
      console.log('Loaded users:', allUsers.length, '(', usersFromDb.length, 'from database)');
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validation
      if (!newUser.name || !newUser.username || !newUser.password) {
        toast.error('Name, username, and password are required');
        return;
      }

      if (newUser.password !== newUser.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newUser.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      // Check if username already exists
      if (users.find(u => u.username === newUser.username)) {
        toast.error('Username already exists');
        return;
      }

      // Determine role based on selection
      const isDeliveryPerson = newUser.role === 'delivery';
      const roleId = isDeliveryPerson ? 'delivery-role-id' : 'sales-rep-role-id';
      const roleName = isDeliveryPerson ? 'Delivery Personnel' : 'Sales Representative';
      const permissions = isDeliveryPerson ? [
        'deliveries:read',
        'deliveries:write'
      ] : [
        'orders:read', 'orders:write',
        'customers:read', 'customers:write',
        'products:read',
        'visits:read', 'visits:write', 'visits:delete'
      ];

      const newUserData: User = {
        id: 'rep-' + Date.now(),
        name: newUser.name,
        username: newUser.username,
        email: `${newUser.username}@herb.com`, // Auto-generate email from username
        phone: newUser.phone,
        role_id: roleId,
        role_name: roleName,
        password: newUser.password, // Store for mock login
        permissions: permissions,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await apiClient.createUser(newUserData);
      console.log('User saved to database:', newUserData.name);
      
      // Refresh users from database
      await fetchUsers();
      
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', username: '', phone: '', password: '', confirmPassword: '', role: 'sales-rep' });
      
      toast.success(`${roleName} ${newUser.name} created successfully! They can now login with username: ${newUser.username}`);
    } catch (error) {
      toast.error('Failed to create user');
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Prevent deleting admin and default sales reps
      const defaultUserIds = ['admin-user-id', 'sales-rep-1'];
      if (defaultUserIds.includes(userId)) {
        toast.error('Cannot delete default users');
        return;
      }

      // Delete from database
      await apiClient.deleteUser(userId);
      console.log('User deleted from database:', userId);

      // Update state
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editUser.name || !editUser.email) {
        toast.error('Name and email are required');
        return;
      }

      const defaultUserIds = ['admin-user-id', 'sales-rep-1'];
      if (selectedUser && defaultUserIds.includes(selectedUser.id)) {
        toast.error('Cannot edit default users');
        return;
      }

      if (!selectedUser) return;

      // Update in database
      await apiClient.updateUser(selectedUser.id, {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        updated_at: new Date().toISOString()
      });
      
      console.log('User updated in database:', selectedUser.id);

      // Update state
      setUsers(users.map(u =>
        u.id === selectedUser?.id
          ? { ...u, name: editUser.name, email: editUser.email, phone: editUser.phone, updated_at: new Date().toISOString() }
          : u
      ));

      setIsEditDialogOpen(false);
      setEditUser({ name: '', email: '', phone: '' });
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-end items-center gap-2">
        {hasPermission('users:write') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Sales Rep
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Add New Sales Representative</DialogTitle>
                <DialogDescription>
                  Create a new sales rep user account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <Label htmlFor="username">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Enter username (for login)"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="role">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newUser.role} onValueChange={(value: any) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales-rep">Sales Representative</SelectItem>
                      <SelectItem value="delivery">Delivery Personnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    placeholder="Confirm password"
                  />
                </div>

                <div className={`${newUser.role === 'delivery' ? 'bg-green' : 'bg-blue'}-50 border border-${newUser.role === 'delivery' ? 'green' : 'blue'}-200 rounded-lg p-3`}>
                  <p className={`text-sm text-${newUser.role === 'delivery' ? 'green' : 'blue'}-800`}>
                    <strong>Role:</strong> {newUser.role === 'delivery' ? 'Delivery Personnel' : 'Sales Representative'}
                  </p>
                  {newUser.role === 'delivery' ? (
                    <p className={`text-xs text-${newUser.role === 'delivery' ? 'green' : 'blue'}-600 mt-1`}>
                      Can view assigned deliveries and confirm deliveries with GPS location, photo, and notes
                    </p>
                  ) : (
                    <>
                      <p className={`text-xs text-${newUser.role === 'delivery' ? 'green' : 'blue'}-600 mt-1`}>
                        Can create/manage orders, customers, view products, and track visits
                      </p>
                      <p className={`text-xs text-${newUser.role === 'delivery' ? 'green' : 'blue'}-500 mt-1`}>
                        ❌ Cannot view: Revenue data, Stock alerts, Reports
                      </p>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewUser({ name: '', username: '', phone: '', password: '', confirmPassword: '', role: 'sales-rep' });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create {newUser.role === 'delivery' ? 'Delivery Personnel' : 'Sales Rep'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage system users and sales representatives
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[120px]">Phone</TableHead>
                <TableHead className="min-w-[150px]">Role</TableHead>
                <TableHead className="min-w-[80px]">Status</TableHead>
                <TableHead className="min-w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role_id === 'admin-role-id' ? 'destructive' : 'default'}>
                      {user.role_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewUser(user)}
                        title="View User Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission('users:write') && user.id !== 'admin-user-id' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('users:delete') && user.id !== 'admin-user-id' && user.id !== currentUser?.id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteUser(user.id)}
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
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">User Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Name</label>
                      <p className="font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Role & Status</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Role</label>
                      <div className="mt-1">
                        <Badge variant={selectedUser.role_id === 'admin-role-id' ? 'destructive' : 'default'}>
                          {selectedUser.role_name}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {selectedUser.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.permissions.map((permission, index) => (
                    <Badge key={index} variant="secondary">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {hasPermission('users:delete') && selectedUser.id !== 'admin-user-id' && selectedUser.id !== currentUser?.id && (
                  <Button 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      handleDeleteUser(selectedUser.id);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </Button>
                )}
                {hasPermission('users:write') && selectedUser.id !== 'admin-user-id' && (
                  <Button onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditUser(selectedUser);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit User
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Sales Representative</DialogTitle>
            <DialogDescription>
              Update sales rep information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_name"
                value={editUser.name}
                onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label htmlFor="edit_email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_email"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                type="tel"
                value={editUser.phone}
                onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Password cannot be changed here. User will keep their existing password.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditUser({ name: '', email: '', phone: '' });
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

export default Users;

