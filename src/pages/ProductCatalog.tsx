import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Download, Printer } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface Product {
  id: string;
  brand_name: string;
  product_name: string;
  description: string;
  category: string;
  pack_size: number;
  image_url?: string;
  wholesale_price: number;
  cost_price: number;
  retail_price: number;
  bonus?: string;
  stock_quantity: number;
  unit: string;
  manufacturer: string;
  status: string;
}

const ProductCatalog: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogInfo, setCatalogInfo] = useState({
    title: 'Product Catalog',
    generatedDate: '',
    repName: ''
  });

  useEffect(() => {
    loadCatalog();
  }, [searchParams]);

  const loadCatalog = async () => {
    const catalogId = searchParams.get('id');
    
    if (catalogId) {
      // Check if catalog is active and not expired in database
      try {
        const allProducts = await apiClient.getProducts();
        const catalogMetadata = allProducts.find((p: any) => 
          p.category === '__shared_catalog__' && p.catalog_id === catalogId
        );
        
        if (catalogMetadata) {
          const now = new Date();
          const expiresAt = new Date(catalogMetadata.expires_at);
          
          if (catalogMetadata.status !== 'active') {
            // Catalog is disabled
            setProducts([]);
            setCatalogInfo({ 
              title: 'Catalog Unavailable', 
              generatedDate: '', 
              repName: 'This catalog has been disabled by the administrator.' 
            });
            return;
          }
          
          if (expiresAt < now) {
            // Catalog is expired
            setProducts([]);
            setCatalogInfo({ 
              title: 'Catalog Expired', 
              generatedDate: '', 
              repName: 'This catalog link has expired. Please request a new one.' 
            });
            return;
          }
          
          // Load catalog data from database (stored in catalog_data field)
          if (catalogMetadata && catalogMetadata.catalog_data) {
            try {
              const catalogData = JSON.parse(catalogMetadata.catalog_data);
              setProducts(catalogData.products || []);
              setCatalogInfo(catalogData.info || {
                title: catalogMetadata.title,
                generatedDate: new Date(catalogMetadata.created_at).toLocaleDateString(),
                repName: catalogMetadata.created_by_name,
                companyName: catalogMetadata.company_name,
                totalProducts: catalogMetadata.product_count
              });
              console.log('Catalog loaded from database:', catalogData.products?.length || 0, 'products');
              return;
            } catch (parseError) {
              console.error('Error parsing catalog data:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Error checking catalog status:', error);
      }
      
      // Fallback: Show error if catalog not found
      setProducts([]);
      setCatalogInfo({ 
        title: 'Catalog Not Found', 
        generatedDate: '', 
        repName: 'This catalog does not exist or has been removed.' 
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      liquor: 'bg-amber-100 text-amber-800',
      beer: 'bg-yellow-100 text-yellow-800',
      wine: 'bg-red-100 text-red-800',
      spirits: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 print:bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page-break { page-break-after: always; }
        }
      `}</style>

      {/* Header - Hidden on Print */}
      <div className="no-print sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📚 Digital Product Catalog</h1>
              <p className="text-sm text-gray-600">Interactive product showcase</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cover Page */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 print:shadow-none">
          <div className="text-center">
            <div className="mb-6">
              <Package className="w-20 h-20 mx-auto text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{catalogInfo.title}</h1>
            <p className="text-xl text-gray-600 mb-4">HERB - Liquor Wholesale Catalog</p>
            <div className="border-t border-b border-gray-200 py-4 my-6">
              <p className="text-sm text-gray-500">Generated on: {catalogInfo.generatedDate || new Date().toLocaleDateString()}</p>
              {catalogInfo.repName && (
                <p className="text-sm text-gray-500">Sales Representative: {catalogInfo.repName}</p>
              )}
              <p className="text-sm text-gray-500">Total Products: {products.length}</p>
            </div>
          </div>
        </div>

        {/* Product Grid - Grouped by Company */}
        {(() => {
          // Group products by company
          const productsByCompany: Record<string, Product[]> = {};
          products.forEach(product => {
            const company = product.manufacturer || 'Other';
            if (!productsByCompany[company]) {
              productsByCompany[company] = [];
            }
            productsByCompany[company].push(product);
          });

          const companies = Object.keys(productsByCompany).sort();

          return companies.map(company => (
            <div key={company} className="mb-12 print:break-inside-avoid">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-6 shadow-md">
                <h2 className="text-2xl font-bold">{company}</h2>
                <p className="text-sm text-blue-100">
                  {productsByCompany[company].length} {productsByCompany[company].length === 1 ? 'product' : 'products'}
                </p>
              </div>

              {/* Products for this company */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {productsByCompany[company].map((product, index) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow print:break-inside-avoid">
              <div className="relative">
                {/* Product Image */}
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                
                {/* Category Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className={getCategoryColor(product.category)}>
                    {product.category.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Stock Badge */}
                {product.stock_quantity > 0 ? (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-green-500 text-white">In Stock</Badge>
                  </div>
                ) : (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-red-500 text-white">Out of Stock</Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {/* Product Info */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{product.brand_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.product_name}</p>
                  <p className="text-xs text-gray-500">{product.manufacturer}</p>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                {/* Pricing */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                    <span className="text-xs font-medium text-blue-900">Wholesale Price</span>
                    <span className="text-lg font-bold text-blue-900">Rs. {product.wholesale_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                    <span className="text-xs font-medium text-green-900">Retail Price</span>
                    <span className="text-lg font-bold text-green-900">Rs. {product.retail_price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Bonus */}
                {product.bonus && product.bonus.trim() !== '' ? (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-3 mb-3 shadow-sm">
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      🎁 Special Offer
                    </p>
                    <p className="text-xs text-yellow-800">
                      {product.bonus}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                    <p className="text-xs text-gray-500 text-center">
                      No special offers at this time
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
                ))}
              </div>
            </div>
          ));
        })()}

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No products in this catalog</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 print:mt-8">
          <p>© 2025 HERB</p>
          <p className="mt-1">For inquiries, contact your sales representative</p>
          <p className="mt-2 text-xs text-gray-400">Developed by K 19</p>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;

