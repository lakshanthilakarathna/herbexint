import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, CheckCircle, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StockStatusProps {
  products: any[];
}

export const StockStatus: React.FC<StockStatusProps> = ({ products }) => {
  // Calculate inventory metrics
  const totalInventoryValue = products.reduce((sum, product) => 
    sum + ((product.stock_quantity || 0) * (product.cost_price || 0)), 0
  );

  const lowStockItems = products.filter(product => {
    const stock = product.stock_quantity || 0;
    const minLevel = product.min_stock_level || 0;
    return stock > 0 && stock <= minLevel;
  });

  const outOfStockItems = products.filter(product => (product.stock_quantity || 0) === 0);

  const overstockItems = products.filter(product => {
    const stock = product.stock_quantity || 0;
    const maxLevel = product.max_stock_level || 0;
    return stock >= maxLevel && maxLevel > 0;
  });

  const normalStockItems = products.filter(product => {
    const stock = product.stock_quantity || 0;
    const minLevel = product.min_stock_level || 0;
    const maxLevel = product.max_stock_level || 1000;
    return stock > minLevel && stock < maxLevel;
  });

  const getStockStatus = (product: any) => {
    const stock = product.stock_quantity || 0;
    const minLevel = product.min_stock_level || 0;
    const maxLevel = product.max_stock_level || 1000;

    if (stock === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (stock <= minLevel) {
      return { label: 'Low Stock', variant: 'default' as const, color: 'text-yellow-600' };
    } else if (stock >= maxLevel && maxLevel > 0) {
      return { label: 'Overstock', variant: 'secondary' as const, color: 'text-blue-600' };
    } else {
      return { label: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      liquor: 'bg-amber-100 text-amber-800',
      beer: 'bg-yellow-100 text-yellow-800',
      wine: 'bg-red-100 text-red-800',
      spirits: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all products</p>
          </CardContent>
        </Card>

        <Card className={lowStockItems.length > 0 ? 'border-yellow-300' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lowStockItems.length > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card className={outOfStockItems.length > 0 ? 'border-red-300' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${outOfStockItems.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overstock Items</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overstockItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Above max level</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Out of Stock Alert */}
          {outOfStockItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Out of Stock Items ({outOfStockItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {outOfStockItems.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="bg-red-600">
                          0
                        </Badge>
                        <span className="font-medium text-sm">{product.product_name}</span>
                      </div>
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  ))}
                  {outOfStockItems.length > 5 && (
                    <p className="text-xs text-red-700 text-center">
                      +{outOfStockItems.length - 5} more items
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Items ({lowStockItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-yellow-600 text-white">
                          {product.stock_quantity}
                        </Badge>
                        <span className="font-medium text-sm">{product.product_name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Min: {product.min_stock_level}
                      </span>
                    </div>
                  ))}
                  {lowStockItems.length > 5 && (
                    <p className="text-xs text-yellow-700 text-center">
                      +{lowStockItems.length - 5} more items
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Product Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products Stock Status</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Qty</TableHead>
                    <TableHead>Min Level</TableHead>
                    <TableHead>Max Level</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const status = getStockStatus(product);
                    const stockValue = (product.stock_quantity || 0) * (product.cost_price || 0);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getCategoryColor(product.category)}>
                            {product.category || 'other'}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.stock_quantity || 0}</TableCell>
                        <TableCell>{product.min_stock_level || 0}</TableCell>
                        <TableCell>{product.max_stock_level || 0}</TableCell>
                        <TableCell>
                          Rs. {stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
