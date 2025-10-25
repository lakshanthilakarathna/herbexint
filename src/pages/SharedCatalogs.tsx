import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { toast } from "sonner";
import { Search, Eye, Copy, ExternalLink, Trash2, Power, PowerOff, Calendar, Package } from 'lucide-react';

interface SharedCatalog {
  id: string;
  catalog_id: string;
  title: string;
  company_name: string;
  product_count: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'inactive' | 'expired';
  url: string;
}

const SharedCatalogs: React.FC = () => {
  const { user } = useAuth();
  const [catalogs, setCatalogs] = useState<SharedCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      // Load from API (stored in products table with special category)
      const data = await apiClient.getProducts();
      const catalogEntries = data.filter((item: any) => item.category === '__shared_catalog__');
      
      // Check expiration and update status
      const now = new Date();
      const catalogsWithStatus = catalogEntries.map((cat: any) => {
        const expiresAt = new Date(cat.expires_at);
        const isExpired = expiresAt < now;
        
        return {
          ...cat,
          status: isExpired ? 'expired' : cat.status
        };
      });
      
      setCatalogs(catalogsWithStatus);
      console.log('Loaded shared catalogs:', catalogsWithStatus.length);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      toast.error('Failed to load shared catalogs');
      setCatalogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (catalogId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await apiClient.updateProduct(catalogId, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      setCatalogs(catalogs.map(cat => 
        cat.id === catalogId 
          ? { ...cat, status: newStatus as 'active' | 'inactive' | 'expired' }
          : cat
      ));
      
      toast.success(`Catalog ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating catalog:', error);
      toast.error('Failed to update catalog status');
    }
  };

  const handleDelete = async (catalogId: string) => {
    if (!confirm('Are you sure you want to delete this shared catalog? The link will stop working.')) {
      return;
    }

    try {
      await apiClient.deleteProduct(catalogId);
      setCatalogs(catalogs.filter(cat => cat.id !== catalogId));
      toast.success('Shared catalog deleted');
    } catch (error) {
      console.error('Error deleting catalog:', error);
      toast.error('Failed to delete catalog');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Catalog URL copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy URL');
    });
  };

  const getStatusBadge = (status: SharedCatalog['status']) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (status === 'inactive') {
      return <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const filteredCatalogs = catalogs.filter(catalog => {
    const matchesSearch = (catalog.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (catalog.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (catalog.created_by_name || '').toLowerCase().includes(searchTerm.toLowerCase());
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
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <CardTitle>Shared Catalogs</CardTitle>
              <CardDescription>
                Manage shared product catalog links (auto-expire after 3 days)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search catalogs..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatalogs.map((catalog) => (
                  <TableRow key={catalog.id}>
                    <TableCell className="font-medium">{catalog.title}</TableCell>
                    <TableCell>{catalog.company_name}</TableCell>
                    <TableCell>{catalog.product_count} items</TableCell>
                    <TableCell>{catalog.created_by_name}</TableCell>
                    <TableCell>{new Date(catalog.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={getDaysRemaining(catalog.expires_at).includes('Expired') ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {getDaysRemaining(catalog.expires_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(catalog.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopyUrl(catalog.url)}
                          title="Copy URL"
                          disabled={catalog.status === 'expired'}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(catalog.url, '_blank')}
                          title="Open Catalog"
                          disabled={catalog.status !== 'active'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {catalog.status !== 'expired' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleStatus(catalog.id, catalog.status)}
                            title={catalog.status === 'active' ? 'Disable' : 'Enable'}
                            className={catalog.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {catalog.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(catalog.id)}
                          title="Delete Catalog"
                          className="text-red-600 hover:text-red-700"
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
          {filteredCatalogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No shared catalogs found.</p>
              <p className="text-sm mt-1">Go to Products page and click "Share Catalog" to create one.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Catalog Link Expiration</p>
              <p className="text-sm text-blue-700">
                All shared catalog links automatically expire after 3 days for security.
                You can manually enable/disable links anytime using the toggle button.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedCatalogs;

