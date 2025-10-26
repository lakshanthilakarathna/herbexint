import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, AlertTriangle, Upload, X, FileDown, Share2, Copy, FileText, List, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';
import { apiClient } from '@/services/apiClient';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  min_stock_level: number;
  max_stock_level: number;
  unit: string;
  manufacturer: string;
  batch_number?: string;
  expiry_date?: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

const Products: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportData, setBulkImportData] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    brand_name: '',
    product_name: '',
    description: '',
    category: 'liquor',
    pack_size: 0,
    image_url: '',
    wholesale_price: 0,
    cost_price: 0,
    retail_price: 0,
    bonus: '',
    stock_quantity: 0,
    min_stock_level: 10,
    max_stock_level: 1000,
    unit: 'pieces',
    manufacturer: '',
    status: 'active'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch from backend API
      const data = await apiClient.getProducts();
      // Filter out customer portal and shared catalog entries
      const actualProducts = Array.isArray(data) ? data.filter((p: any) => 
        p.category !== '__customer_portal__' && p.category !== '__shared_catalog__'
      ) : [];
      setProducts(actualProducts);
      console.log('Loaded products from database:', actualProducts?.length || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Database connection failed. Check if Lambda function is uploaded.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Compress image to fit backend API's 400KB item size limit
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 400x400 to keep size small)
          let width = img.width;
          let height = img.height;
          const maxSize = 400;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels until size is acceptable
          let quality = 0.7;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // backend API has 400KB limit, but we need room for other fields
          // Target max 100KB for image (base64)
          const maxSizeBytes = 100 * 1024;
          
          while (compressedDataUrl.length > maxSizeBytes && quality > 0.1) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          if (compressedDataUrl.length > maxSizeBytes) {
            reject(new Error('Image too large even after compression. Please use a smaller image.'));
          } else {
            console.log(`Image compressed: Original ~${file.size} bytes, Compressed ~${compressedDataUrl.length} bytes`);
            resolve(compressedDataUrl);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      try {
        toast.info('Compressing image...');
        // Compress image to fit in backend API (400KB limit)
        const compressedDataUrl = await compressImage(file);
        setImagePreview(compressedDataUrl);
        setNewProduct({...newProduct, image_url: compressedDataUrl});
        toast.success('Image compressed and ready!');
      } catch (error: any) {
        console.error('Image compression error:', error);
        toast.error(error.message || 'Failed to compress image');
        setSelectedImage(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setNewProduct({...newProduct, image_url: ''});
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      try {
        toast.info('Compressing image...');
        // Compress image to fit in backend API (400KB limit)
        const compressedDataUrl = await compressImage(file);
        setEditImagePreview(compressedDataUrl);
        setEditProduct({...editProduct, image_url: compressedDataUrl});
        toast.success('Image compressed and ready!');
      } catch (error: any) {
        console.error('Image compression error:', error);
        toast.error(error.message || 'Failed to compress image');
      }
    }
  };

  const handleRemoveEditImage = () => {
    setEditImagePreview('');
    setEditProduct({...editProduct, image_url: ''});
  };

  const handleCreateProduct = async () => {
    try {
      // Validate required fields
      if (!newProduct.product_name || !newProduct.product_name.trim()) {
        toast.error('Please enter a product name');
        return;
      }
      
      if (!newProduct.pack_size || newProduct.pack_size <= 0) {
        toast.error('Please enter a valid pack size');
        return;
      }
      
      if (!newProduct.wholesale_price || newProduct.wholesale_price <= 0) {
        toast.error('Please enter a valid wholesale price');
        return;
      }
      
      if (!newProduct.cost_price || newProduct.cost_price <= 0) {
        toast.error('Please enter a valid cost price');
        return;
      }
      
      if (!newProduct.retail_price || newProduct.retail_price <= 0) {
        toast.error('Please enter a valid retail price');
        return;
      }
      
      // Generate unique ID using timestamp
      const uniqueId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const productData: Product = {
        id: uniqueId,
        brand_name: newProduct.brand_name.trim(),
        product_name: newProduct.product_name.trim(),
        description: newProduct.description?.trim() || '',
        category: newProduct.category || 'liquor',
        pack_size: Number(newProduct.pack_size),
        image_url: imagePreview || newProduct.image_url || '',
        wholesale_price: Number(newProduct.wholesale_price),
        cost_price: Number(newProduct.cost_price),
        retail_price: Number(newProduct.retail_price),
        bonus: newProduct.bonus?.trim() || '',
        stock_quantity: Number(newProduct.stock_quantity) || 0,
        min_stock_level: Number(newProduct.min_stock_level) || 10,
        max_stock_level: Number(newProduct.max_stock_level) || 1000,
        unit: newProduct.unit || 'pieces',
        manufacturer: newProduct.manufacturer?.trim() || '',
        batch_number: newProduct.batch_number?.trim() || '',
        expiry_date: newProduct.expiry_date || '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Creating product with data:', productData);
      
      // Check total item size (backend API has 400KB limit)
      const itemSizeBytes = new Blob([JSON.stringify(productData)]).size;
      console.log(`Product item size: ${(itemSizeBytes / 1024).toFixed(2)} KB`);
      
      if (itemSizeBytes > 380 * 1024) { // 380KB to leave some margin
        toast.error('Product data too large for database. Please use a smaller image or remove the image.');
        console.error(`Item size ${itemSizeBytes} bytes exceeds backend API limit`);
        return;
      }
      
      // Save to backend API via API Gateway
      toast.info('Saving product to database...');
      const createdProduct = await apiClient.createProduct(productData);
      
      console.log('Product created successfully:', createdProduct);
      
      // Update local state
      setProducts([createdProduct, ...products]);
      
      setIsCreateDialogOpen(false);
      setNewProduct({
        brand_name: '',
        product_name: '',
        description: '',
        category: 'liquor',
        pack_size: 0,
        image_url: '',
        wholesale_price: 0,
        cost_price: 0,
        retail_price: 0,
        bonus: '',
        stock_quantity: 0,
        min_stock_level: 10,
        max_stock_level: 1000,
        unit: 'pieces',
        manufacturer: '',
        status: 'active'
      });
      setSelectedImage(null);
      setImagePreview('');
      toast.success('Product saved successfully!');
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error.message || 'Failed to save product to database';
      toast.error(`Error: ${errorMessage}`);
      
      // Log more details for debugging
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditProduct({...product});
    setEditImagePreview(product.image_url || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editProduct.id) return;
      
      // Update in backend API
      const updated = await apiClient.updateProduct(editProduct.id, editProduct);
      
      // Update local state
      const updatedProducts = products.map(p => 
        p.id === editProduct.id ? updated : p
      );
      setProducts(updatedProducts);
      setIsEditDialogOpen(false);
      setEditProduct({});
      setEditImagePreview('');
      toast.success('Product updated in database!');
    } catch (error) {
      toast.error('Failed to update product in database');
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Delete from backend API
      await apiClient.deleteProduct(productId);
      
      // Update local state
      setProducts(products.filter(product => product.id !== productId));
      toast.success('Product deleted from database!');
    } catch (error) {
      toast.error('Failed to delete product from database');
      console.error('Error deleting product:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, productId]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select products to delete');
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedProductIds.length} selected products from database?`);
    if (confirmed) {
      toast.info(`Deleting ${selectedProductIds.length} products from database...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Delete each product from backend API
      for (const productId of selectedProductIds) {
        try {
          await apiClient.deleteProduct(productId);
          successCount++;
        } catch (error) {
          console.error('Error deleting product:', productId, error);
          errorCount++;
        }
      }
      
      // Update local state
      setProducts(products.filter(p => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
      
      toast.success(`${successCount} products deleted from database! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`);
    }
  };

  const handleBulkExportPDF = async () => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select products to export');
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Selected Products Catalog', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

      const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
      const tableData = selectedProducts.map(product => [
        product.brand_name,
        product.product_name,
        product.pack_size.toString(),
        `Rs. ${(product.wholesale_price || 0).toFixed(2)}`,
        `Rs. ${(product.cost_price || 0).toFixed(2)}`,
        `Rs. ${(product.retail_price || 0).toFixed(2)}`,
        product.stock_quantity.toString()
      ]);

      autoTable(doc, {
        head: [['Brand', 'Product', 'Pack', 'Wholesale', 'Cost', 'Retail', 'Stock']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`selected-products-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`Exported ${selectedProductIds.length} selected products`);
    } catch (error) {
      toast.error('Failed to export selected products');
      console.error('Error:', error);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `Product Name,Pack Size,Wholesale Price,Cost Price,Retail Price,Bonus,Description,Stock,Company Name
Premium Arrack 750ml,12,1200,800,1500,1+1 on bulk orders,Premium toddy liquor,500,HerbDistillery
Local Beer 330ml,24,180,120,220,Free shipping on 50+,Local brewery beer,750,HerbBrewery
Red Wine 750ml,6,2500,1800,3000,10% off on 100+,Imported wine,300,HerbWines`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded! Fill it with your products from the PDF.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkImportData(text);
      toast.success('File loaded! Review the data and click Import.');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    try {
      if (!bulkImportData.trim()) {
        toast.error('Please paste product data');
        return;
      }

      const lines = bulkImportData.trim().split('\n');
      const importedProducts: Product[] = [];
      let successCount = 0;
      let errorCount = 0;

      toast.info('Importing products to database...');

      // Parse all lines first
      const parsedProducts: any[] = [];
      lines.forEach((line, index) => {
        try {
          // Skip header row if it exists
          if ((line.toLowerCase().includes('brand') || line.toLowerCase().includes('generic')) && line.toLowerCase().includes('product')) {
            return;
          }

          // Parse CSV format: Brand Name, Product Name, Pack Size, Wholesale Price, Cost Price, Retail Price, Bonus
          const parts = line.split(',').map(p => p.trim());
          
          if (parts.length >= 6) {
            const product = {
              brand_name: '', // Optional, not in CSV
              product_name: parts[0] || '',
              description: parts[6] || '',
              category: 'liquor',
              pack_size: parseInt(parts[1]) || 0,
              image_url: '',
              wholesale_price: parseFloat(parts[2]) || 0,
              cost_price: parseFloat(parts[3]) || 0,
              retail_price: parseFloat(parts[4]) || 0,
              bonus: parts[5] || '',
              stock_quantity: parseInt(parts[7]) || 0,
              min_stock_level: 10,
              max_stock_level: 1000,
              unit: 'pieces',
              manufacturer: parts[8] || 'Unknown',
              status: 'active' as const,
            };

            if (product.product_name) {
              parsedProducts.push(product);
            }
          }
        } catch (error) {
          console.error('Error parsing line:', line, error);
        }
      });

      // Save each product to database
      for (const productData of parsedProducts) {
        try {
          const created = await apiClient.createProduct(productData);
          importedProducts.push(created);
          successCount++;
        } catch (error) {
          console.error('Error saving product:', productData.brand_name, error);
          errorCount++;
        }
      }

      if (importedProducts.length > 0) {
        setProducts([...importedProducts, ...products]);
        setIsBulkImportOpen(false);
        setBulkImportData('');
        toast.success(`Successfully imported ${successCount} products to database! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`);
      } else {
        toast.error('No valid products found in the data');
      }
    } catch (error) {
      toast.error('Failed to import products');
      console.error('Error importing products:', error);
    }
  };

  const handleShareCatalog = async () => {
    try {
      // Generate unique catalog ID
      const catalogId = 'cat_' + Date.now();
      
      const companyName = companyFilter !== 'all' ? companyFilter : 'All Companies';
      const catalogTitle = companyFilter !== 'all' ? `${companyName} - Product Catalog` : 'Product Catalog';
      
      // Calculate expiration date (3 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);
      
      // Prepare catalog data for database storage
      const catalogData = {
        products: filteredProducts,
        info: {
          title: catalogTitle,
          generatedDate: new Date().toLocaleDateString(),
          repName: user?.name || 'Sales Representative',
          companyName: companyName,
          totalProducts: filteredProducts.length
        }
      };
      
      // Save catalog metadata AND full product data to database
      const catalogMetadata = {
        id: 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9), // Generate unique ID
        catalog_id: catalogId,
        title: catalogTitle,
        company_name: companyName,
        product_count: filteredProducts.length,
        created_by: user?.id || 'system',
        created_by_name: user?.name || 'User',
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
        url: `${window.location.origin}/catalog?id=${catalogId}`,
        catalog_data: JSON.stringify(catalogData), // Store full catalog data as JSON string
        // Store as special product entry
        category: '__shared_catalog__',
        brand_name: '__catalog__',
        product_name: catalogTitle,
        retail_price: 0,
        stock_quantity: 0
      };
      
      // Save to backend API
      const savedCatalog = await apiClient.createProduct(catalogMetadata);
      console.log('Catalog metadata saved to database:', savedCatalog);
      
      // Generate shareable URL
      const catalogUrl = `${window.location.origin}/catalog?id=${catalogId}`;
      
      // Copy to clipboard with fallback
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(catalogUrl);
        } else {
          // Fallback for browsers without clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = catalogUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        toast.success(
          <div>
            <p className="font-semibold">{companyName} catalog link copied!</p>
            <p className="text-xs mt-1">{filteredProducts.length} products • Expires in 3 days</p>
            <p className="text-xs font-mono mt-1 bg-gray-100 p-1 rounded break-all">{catalogUrl}</p>
          </div>,
          { duration: 6000 }
        );
      } catch (clipboardError) {
        // If clipboard copy fails, just show the URL
        toast.success(
          <div>
            <p className="font-semibold">{companyName} catalog created!</p>
            <p className="text-xs mt-1">{filteredProducts.length} products • Expires in 3 days</p>
            <p className="text-xs font-mono mt-2 bg-gray-100 p-2 rounded break-all">{catalogUrl}</p>
            <p className="text-xs text-gray-500 mt-1">Copy this link manually</p>
          </div>,
          { duration: 8000 }
        );
      }
    } catch (error) {
      console.error('Error generating catalog:', error);
      toast.error(`Failed to generate catalog link: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      
      const companyName = companyFilter !== 'all' ? companyFilter : 'All Companies';
      
      // Add title
      doc.setFontSize(18);
      const title = companyFilter !== 'all' ? `${companyName} - Product Catalog` : 'Product Catalog';
      doc.text(title, 14, 20);
      
      // Add date and info
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
      if (companyFilter !== 'all') {
        doc.text(`Company: ${companyName}`, 14, 34);
        doc.text(`Total Products: ${filteredProducts.length}`, 14, 40);
      }
      
      // Prepare table data with images
      const tableData = await Promise.all(
        filteredProducts.map(async (product, index) => {
          return {
            brand: product.brand_name,
            product: product.product_name,
            pack_size: product.pack_size.toString(),
            wholesale: `Rs. ${(product.wholesale_price || 0).toFixed(2)}`,
            cost: `Rs. ${(product.cost_price || 0).toFixed(2)}`,
            retail: `Rs. ${(product.retail_price || 0).toFixed(2)}`,
            stock: product.stock_quantity.toString(),
            status: product.status,
            image: product.image_url
          };
        })
      );
      
      // Add table with images
      autoTable(doc, {
        head: [['Image', 'Brand', 'Product', 'Pack', 'Wholesale', 'Cost', 'Retail', 'Stock', 'Status']],
        body: tableData.map(row => [
          '', // Image placeholder
          row.brand,
          row.product,
          row.pack_size,
          row.wholesale,
          row.cost,
          row.retail,
          row.stock,
          row.status
        ]),
        startY: companyFilter !== 'all' ? 45 : 35,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 15 } // Image column
        },
        didDrawCell: async (data: any) => {
          if (data.section === 'body' && data.column.index === 0) {
            const product = tableData[data.row.index];
            if (product.image) {
              try {
                const imgData = product.image;
                const imgWidth = 12;
                const imgHeight = 12;
                const x = data.cell.x + 1.5;
                const y = data.cell.y + 1;
                
                doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
              } catch (error) {
                console.error('Error adding image:', error);
              }
            }
          }
        }
      });
      
      // Add summary at the bottom
      const finalY = (doc as any).lastAutoTable.finalY || 35;
      doc.setFontSize(10);
      doc.text(`Total Products: ${filteredProducts.length}`, 14, finalY + 10);
      
      // Save PDF
      const filename = companyFilter !== 'all' 
        ? `${companyName.replace(/\s+/g, '-')}-products-${new Date().toISOString().split('T')[0]}.pdf`
        : `products-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success(`PDF exported: ${companyName} (${filteredProducts.length} products)`);
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('Error exporting PDF:', error);
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      liquor: { color: 'bg-amber-100 text-amber-800', label: 'Liquor' },
      beer: { color: 'bg-yellow-100 text-yellow-800', label: 'Beer' },
      wine: { color: 'bg-red-100 text-red-800', label: 'Wine' },
      spirits: { color: 'bg-purple-100 text-purple-800', label: 'Spirits' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Other' }
    };
    
    // Safety check for undefined/null category
    if (!category || typeof category !== 'string') {
      category = 'liquor'; // Default to 'liquor'
    }
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.liquor;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: Product['status']) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      discontinued: { color: 'bg-red-100 text-red-800', label: 'Discontinued' }
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

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= product.min_stock_level) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      );
    } else if (product.stock_quantity >= product.max_stock_level * 0.9) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          High Stock
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Package className="w-3 h-3 mr-1" />
          In Stock
        </Badge>
      );
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || product.manufacturer === companyFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stock_quantity <= product.min_stock_level;
    } else if (stockFilter === 'high') {
      matchesStock = product.stock_quantity >= product.max_stock_level * 0.9;
    } else if (stockFilter === 'normal') {
      matchesStock = product.stock_quantity > product.min_stock_level && 
                    product.stock_quantity < product.max_stock_level * 0.9;
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStock && matchesCompany;
  });

  // Get unique companies from products
  const uniqueCompanies = Array.from(new Set(products.map(p => p.manufacturer).filter(Boolean))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {selectedProductIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-semibold text-blue-900">{selectedProductIds.length} products selected</p>
              <p className="text-xs text-blue-700">Perform actions on selected products</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkExportPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              {hasPermission('products:delete') && (
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedProductIds([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            toast.info('Refreshing products...');
            fetchProducts();
          }}
          title="Refresh product list to see latest stock levels"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Stock
        </Button>
        {user?.role_id === 'admin-role-id' && (
          <Button variant="outline" onClick={() => navigate('/shared-catalogs')}>
            <List className="w-4 h-4 mr-2" />
            Manage Shared Catalogs
          </Button>
        )}
        <Button variant="outline" onClick={handleShareCatalog}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Catalog
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          <FileDown className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        {hasPermission('products:write') && (
          <>
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product in the catalog
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand_name">Brand Name</Label>
                    <Input
                      id="brand_name"
                      value={newProduct.brand_name || ''}
                      onChange={(e) => setNewProduct({...newProduct, brand_name: e.target.value})}
                      placeholder="Enter brand name (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_name">Product Name *</Label>
                    <Input
                      id="product_name"
                      value={newProduct.product_name || ''}
                      onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                      placeholder="Enter product name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pack_size">Pack Size *</Label>
                  <Input
                    id="pack_size"
                    type="number"
                    value={newProduct.pack_size || ''}
                    onChange={(e) => setNewProduct({...newProduct, pack_size: Number(e.target.value)})}
                    placeholder="Enter pack size"
                  />
                </div>
                
                <div>
                  <Label>Product Image</Label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Product preview" 
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <label 
                          htmlFor="image-upload" 
                          className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                        >
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-xs text-gray-500">Upload Image</p>
                          </div>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                        </label>
                        <div className="text-sm text-gray-500">
                          <p>Click to upload product image</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                          <p className="text-xs text-blue-600 mt-1">✓ Auto-compressed for database</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="liquor">Liquor</SelectItem>
                        <SelectItem value="beer">Beer</SelectItem>
                        <SelectItem value="wine">Wine</SelectItem>
                        <SelectItem value="spirits">Spirits</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Company Name</Label>
                    <Input
                      id="manufacturer"
                      value={newProduct.manufacturer || ''}
                      onChange={(e) => setNewProduct({...newProduct, manufacturer: e.target.value})}
                      placeholder="Enter company name (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="wholesale_price">Wholesale Price (LKR) *</Label>
                    <Input
                      id="wholesale_price"
                      type="number"
                      step="0.01"
                      value={newProduct.wholesale_price || ''}
                      onChange={(e) => setNewProduct({...newProduct, wholesale_price: Number(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost_price">Cost Price (LKR) *</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={newProduct.cost_price || ''}
                      onChange={(e) => setNewProduct({...newProduct, cost_price: Number(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="retail_price">Retail Price (LKR) *</Label>
                    <Input
                      id="retail_price"
                      type="number"
                      step="0.01"
                      value={newProduct.retail_price || ''}
                      onChange={(e) => setNewProduct({...newProduct, retail_price: Number(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bonus">Bonus</Label>
                    <Input
                      id="bonus"
                      value={newProduct.bonus || ''}
                      onChange={(e) => setNewProduct({...newProduct, bonus: e.target.value})}
                      placeholder="Enter bonus details"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newProduct.unit} onValueChange={(value) => setNewProduct({...newProduct, unit: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="pairs">Pairs</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="grams">Grams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={newProduct.stock_quantity || ''}
                      onChange={(e) => setNewProduct({...newProduct, stock_quantity: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_stock_level">Min Stock Level</Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      value={newProduct.min_stock_level || ''}
                      onChange={(e) => setNewProduct({...newProduct, min_stock_level: Number(e.target.value)})}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_stock_level">Max Stock Level</Label>
                    <Input
                      id="max_stock_level"
                      type="number"
                      value={newProduct.max_stock_level || ''}
                      onChange={(e) => setNewProduct({...newProduct, max_stock_level: Number(e.target.value)})}
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProduct}>
                    Create Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                View and manage all products in the catalog
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="liquor">Liquor</SelectItem>
                  <SelectItem value="beer">Beer</SelectItem>
                  <SelectItem value="wine">Wine</SelectItem>
                  <SelectItem value="spirits">Spirits</SelectItem>
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
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {uniqueCompanies.map(company => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile View - Card Layout */}
          <div className="block lg:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products found matching your criteria.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{product.brand_name}</h3>
                        <p className="text-sm text-gray-600">{product.product_name}</p>
                        <p className="text-xs text-gray-500">{product.manufacturer}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {getCategoryBadge(product.category)}
                      {getStatusBadge(product.status)}
                      {getStockStatus(product)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-blue-600">Wholesale</div>
                        <div className="font-bold text-blue-900">Rs. {(product.wholesale_price || 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-xs text-green-600">Retail</div>
                        <div className="font-bold text-green-900">Rs. {(product.retail_price || 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Pack Size</div>
                        <div className="font-semibold">{product.pack_size} {product.unit}</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="text-xs text-purple-600">Stock</div>
                        <div className="font-semibold">{product.stock_quantity} {product.unit}</div>
                      </div>
                    </div>

                    {product.bonus && (
                      <div className="bg-green-100 border border-green-300 p-2 rounded mb-3">
                        <div className="text-xs text-green-700 font-medium">{product.bonus}</div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewProduct(product)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {hasPermission('products:write') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {hasPermission('products:write') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProduct(product.id)}
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
          <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Brand & Product</TableHead>
                <TableHead>Pack Size</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className={selectedProductIds.includes(product.id) ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProductIds.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.brand_name}</div>
                      <div className="text-sm text-gray-600">{product.product_name}</div>
                      <div className="text-xs text-gray-500">{product.manufacturer}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.pack_size}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-500">Wholesale:</span> <span className="font-medium">Rs. {(product.wholesale_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Cost:</span> Rs. {(product.cost_price || 0).toFixed(2)}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Retail:</span> Rs. {(product.retail_price || 0).toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.bonus ? (
                      <div className="text-sm text-green-600 max-w-[150px]">{product.bonus}</div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.stock_quantity} {product.unit}</div>
                      <div className="mt-1">{getStockStatus(product)}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProduct(product)}
                        title="View Product Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission('products:write') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('products:write') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProduct(product.id)}
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
          {filteredProducts.length === 0 && (
            <div className="hidden lg:block text-center py-8 text-gray-500">
              No products found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              View detailed information about this product
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Image and Basic Info */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.product_name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedProduct.brand_name}</h3>
                  <p className="text-lg text-gray-700 mt-1">{selectedProduct.product_name}</p>
                  <div className="flex gap-3 mt-3">
                    {getCategoryBadge(selectedProduct.category)}
                    {getStatusBadge(selectedProduct.status)}
                    {getStockStatus(selectedProduct)}
                  </div>
                </div>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Product Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Pack Size</label>
                      <p className="font-medium">{selectedProduct.pack_size} units</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Unit</label>
                      <p className="font-medium capitalize">{selectedProduct.unit}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Manufacturer</label>
                      <p className="font-medium">{selectedProduct.manufacturer}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Pricing Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-900">Wholesale Price</span>
                      <span className="text-lg font-bold text-blue-900">Rs. {(selectedProduct.wholesale_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Cost Price</span>
                      <span className="text-lg font-bold text-gray-900">Rs. {(selectedProduct.cost_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-900">Retail Price</span>
                      <span className="text-lg font-bold text-green-900">Rs. {(selectedProduct.retail_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <label className="text-xs text-purple-700 font-medium">Profit Margin</label>
                      <p className="text-sm font-bold text-purple-900">
                        Rs. {((selectedProduct.retail_price || 0) - (selectedProduct.cost_price || 0)).toFixed(2)} 
                        <span className="text-xs ml-1">
                          ({(((selectedProduct.retail_price || 0) - (selectedProduct.cost_price || 0)) / (selectedProduct.cost_price || 1) * 100).toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonus Information */}
              {selectedProduct.bonus && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Bonus & Promotions</h4>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">{selectedProduct.bonus}</p>
                  </div>
                </div>
              )}

              {/* Stock Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">Stock Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-xs text-gray-500">Current Stock</label>
                    <p className="text-2xl font-bold mt-1">{selectedProduct.stock_quantity}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedProduct.unit}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-xs text-gray-500">Min Level</label>
                    <p className="text-2xl font-bold mt-1">{selectedProduct.min_stock_level}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedProduct.unit}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-xs text-gray-500">Max Level</label>
                    <p className="text-2xl font-bold mt-1">{selectedProduct.max_stock_level}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedProduct.unit}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedProduct.description}</p>
                </div>
              )}

              {/* Batch Information (if available) */}
              {(selectedProduct.batch_number || selectedProduct.expiry_date) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">Batch Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.batch_number && (
                      <div>
                        <label className="text-xs text-gray-500">Batch Number</label>
                        <p className="font-mono font-medium">{selectedProduct.batch_number}</p>
                      </div>
                    )}
                    {selectedProduct.expiry_date && (
                      <div>
                        <label className="text-xs text-gray-500">Expiry Date</label>
                        <p className="font-medium">{new Date(selectedProduct.expiry_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {hasPermission('products:write') && (
                  <>
                    <Button 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        handleDeleteProduct(selectedProduct.id);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Product
                    </Button>
                    <Button onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditProduct(selectedProduct);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Product
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                                <div>
                    <Label htmlFor="edit_brand_name">Brand Name</Label>
                    <Input
                      id="edit_brand_name"
                      value={editProduct.brand_name || ''}
                      onChange={(e) => setEditProduct({...editProduct, brand_name: e.target.value})}
                      placeholder="Enter brand name (optional)"
                    />
                  </div>
              <div>
                <Label htmlFor="edit_product_name">Product Name *</Label>
                <Input
                  id="edit_product_name"
                  value={editProduct.product_name || ''}
                  onChange={(e) => setEditProduct({...editProduct, product_name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_pack_size">Pack Size *</Label>
              <Input
                id="edit_pack_size"
                type="number"
                value={editProduct.pack_size || ''}
                onChange={(e) => setEditProduct({...editProduct, pack_size: Number(e.target.value)})}
                placeholder="Enter pack size"
              />
            </div>

            <div>
              <Label>Product Image</Label>
              <div className="mt-2">
                {editImagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={editImagePreview} 
                      alt="Product preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveEditImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <label 
                      htmlFor="edit-image-upload" 
                      className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-xs text-gray-500">Upload Image</p>
                      </div>
                      <input
                        id="edit-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditImageSelect}
                      />
                    </label>
                    <div className="text-sm text-gray-500">
                      <p>Click to upload product image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                      <p className="text-xs text-blue-600 mt-1">✓ Auto-compressed for database</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editProduct.description || ''}
                onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_category">Category *</Label>
                <Select value={editProduct.category} onValueChange={(value) => setEditProduct({...editProduct, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liquor">Liquor</SelectItem>
                    <SelectItem value="beer">Beer</SelectItem>
                    <SelectItem value="wine">Wine</SelectItem>
                    <SelectItem value="spirits">Spirits</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_manufacturer">Company Name</Label>
                <Input
                  id="edit_manufacturer"
                  value={editProduct.manufacturer || ''}
                  onChange={(e) => setEditProduct({...editProduct, manufacturer: e.target.value})}
                  placeholder="Enter company name (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_wholesale_price">Wholesale Price (LKR) *</Label>
                <Input
                  id="edit_wholesale_price"
                  type="number"
                  step="0.01"
                  value={editProduct.wholesale_price || ''}
                  onChange={(e) => setEditProduct({...editProduct, wholesale_price: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit_cost_price">Cost Price (LKR) *</Label>
                <Input
                  id="edit_cost_price"
                  type="number"
                  step="0.01"
                  value={editProduct.cost_price || ''}
                  onChange={(e) => setEditProduct({...editProduct, cost_price: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit_retail_price">Retail Price (LKR) *</Label>
                <Input
                  id="edit_retail_price"
                  type="number"
                  step="0.01"
                  value={editProduct.retail_price || ''}
                  onChange={(e) => setEditProduct({...editProduct, retail_price: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_bonus">Bonus</Label>
                <Input
                  id="edit_bonus"
                  value={editProduct.bonus || ''}
                  onChange={(e) => setEditProduct({...editProduct, bonus: e.target.value})}
                  placeholder="Enter bonus details"
                />
              </div>
              <div>
                <Label htmlFor="edit_unit">Unit</Label>
                <Select value={editProduct.unit} onValueChange={(value) => setEditProduct({...editProduct, unit: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="pairs">Pairs</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="grams">Grams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_stock_quantity">Stock Quantity *</Label>
                <Input
                  id="edit_stock_quantity"
                  type="number"
                  value={editProduct.stock_quantity || ''}
                  onChange={(e) => setEditProduct({...editProduct, stock_quantity: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit_min_stock_level">Min Stock Level</Label>
                <Input
                  id="edit_min_stock_level"
                  type="number"
                  value={editProduct.min_stock_level || ''}
                  onChange={(e) => setEditProduct({...editProduct, min_stock_level: Number(e.target.value)})}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="edit_max_stock_level">Max Stock Level</Label>
                <Input
                  id="edit_max_stock_level"
                  type="number"
                  value={editProduct.max_stock_level || ''}
                  onChange={(e) => setEditProduct({...editProduct, max_stock_level: Number(e.target.value)})}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditProduct({});
                setEditImagePreview('');
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

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Bulk Import Products</DialogTitle>
            <DialogDescription>
              Import multiple products at once from CSV data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🚀 Quick Import Steps:</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <div>
                    <strong>Download Template:</strong> Click button below to get CSV template
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <div>
                    <strong>Open in Excel:</strong> Open the downloaded CSV file
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <div>
                    <strong>Copy from PDF:</strong> Copy product data from stk 8.1.pdf and paste into Excel
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <div>
                    <strong>Upload:</strong> Save and upload the CSV file OR copy all data and paste below
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="bulk-data">Product Data (CSV Format)</Label>
                <div>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                </div>
              </div>
              <Textarea
                id="bulk-data"
                value={bulkImportData}
                onChange={(e) => setBulkImportData(e.target.value)}
                placeholder="Paste your product data here in CSV format:&#10;Product Name, Pack Size, Wholesale, Cost, Retail, Bonus, Description, Stock, Company Name&#10;&#10;Example:&#10;Premium Arrack 750ml, 12, 1200, 800, 1500, 1+1 offer, Premium toddy, 500, HerbDistillery&#10;Local Beer 330ml, 24, 180, 120, 220, 10% off, Local brewery, 300, HerbBrewery"
                rows={12}
                className="font-mono text-sm"
              />
              <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <span className="text-yellow-800">💡</span>
                <p className="text-xs text-yellow-800">
                  <strong>From PDF to System:</strong> Open your PDF → Select & copy product data → 
                  Paste in Excel → Format as CSV → Copy all → Paste here → Click Import
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {bulkImportData.trim() && (
                  <span>Ready to import {bulkImportData.trim().split('\n').length} lines</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setIsBulkImportOpen(false);
                  setBulkImportData('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleBulkImport}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Products
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
