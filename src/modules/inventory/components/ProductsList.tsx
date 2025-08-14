import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { productsApi } from '../api/products';
import { AdvancedTableFilter, FilterRule, FilterColumn } from '../../sales-inventory/components/AdvancedTableFilter';
import type { Product, ProductFilters, ProductType } from '../types/products';

// Mock data based on the user's requirements
const mockProducts: Product[] = [
  {
    id: '1',
    brand: 'LG',
    model: 'WT7305CV',
    kwCode: 'LG-WT7305CV',
    description: '4.8 cu. ft. Mega Capacity Smart wi-fi Enabled Top Load Washer with Agitator and TurboWash3D Technology',
    mapPrice: 1149.00,
    productType: 'WASHER' as ProductType,
    dimensions: '27" x 44 1/2" x 28 3/8" (57 1/4" H with lid open) (W x H x D)',
    features: '4.8 cu. ft. Mega Capacity , 4-way Agitator, TurboWash3D & 6Motion Technologies, Smart Pairing, ThinQ Technology with Proactive Customer Care, Deep Fill Option',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    brand: 'LG',
    model: 'LSXS26366D',
    kwCode: 'LG-LSXS26366D',
    description: '26 cu. ft. Door-in-Door Refrigerator',
    mapPrice: 1899.00,
    productType: 'REFRIGERATOR' as ProductType,
    dimensions: '35 7/9" x 69 3/8" x 34" (W x H x D)',
    features: '26 cu. ft. Capacity, PrintProof Finish, Door-in-Door , SpacePlus Ice System',
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
  },
  {
    id: '3',
    brand: 'Samsung',
    model: 'WF45R6100AC',
    kwCode: 'SAM-WF45R6100AC',
    description: '4.5 cu. ft. Front Load Washer with VRT Plus Technology',
    mapPrice: 799.00,
    productType: 'WASHER' as ProductType,
    dimensions: '27" x 38 5/8" x 33 1/4" (W x H x D)',
    features: 'VRT Plus Technology, Self Clean+, Smart Care, 12 Wash Cycles',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-10T12:00:00Z',
  },
  {
    id: '4',
    brand: 'Whirlpool',
    model: 'WDF520PADM',
    kwCode: 'WP-WDF520PADM',
    description: 'Built-In Dishwasher with Sensor Cycle',
    mapPrice: 549.00,
    productType: 'DISHWASHER' as ProductType,
    dimensions: '23 7/8" x 34" x 24" (W x H x D)',
    features: 'Sensor Cycle, Heated Dry, Silverware Basket, Energy Star Certified',
    createdAt: '2024-01-03T14:00:00Z',
    updatedAt: '2024-01-08T16:30:00Z',
  },
  {
    id: '5',
    brand: 'GE',
    model: 'JGB735SPSS',
    kwCode: 'GE-JGB735SPSS',
    description: '30" Free-Standing Gas Range with Convection',
    mapPrice: 1249.00,
    productType: 'RANGE' as ProductType,
    dimensions: '29 7/8" x 47 1/4" x 28 1/4" (W x H x D)',
    features: 'Convection Oven, Edge-to-Edge Cooktop, Chef Connect, WiFi Connect',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-05T11:00:00Z',
  },
];

interface ProductsListProps {
  storeId: string;
}

export function ProductsList({ storeId }: ProductsListProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store original data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterRule[]>([]);

  // Define filter columns
  const filterColumns: FilterColumn[] = [
    { 
      key: 'productType', 
      label: 'Type', 
      dataType: 'select',
      options: [
        { value: 'WASHER', label: 'Washer' },
        { value: 'DRYER', label: 'Dryer' },
        { value: 'REFRIGERATOR', label: 'Refrigerator' },
        { value: 'DISHWASHER', label: 'Dishwasher' },
        { value: 'RANGE', label: 'Range' },
        { value: 'MICROWAVE', label: 'Microwave' },
        { value: 'OTHER', label: 'Other' },
      ]
    },
    { 
      key: 'brand', 
      label: 'Brand', 
      dataType: 'select',
      options: [
        { value: 'LG', label: 'LG' },
        { value: 'Samsung', label: 'Samsung' },
        { value: 'Whirlpool', label: 'Whirlpool' },
        { value: 'GE', label: 'GE' },
        { value: 'Maytag', label: 'Maytag' },
      ]
    },
    { key: 'model', label: 'Model', dataType: 'text' },
    { key: 'description', label: 'Description', dataType: 'text' },
    { key: 'dimensions', label: 'Dimensions', dataType: 'text' },
    { key: 'features', label: 'Features', dataType: 'text' },
    { key: 'mapPrice', label: 'MAP Price', dataType: 'number' },
  ];

  // Load initial data
  useEffect(() => {
    loadProducts();
  }, []);

  // Apply filters when they change, but only after initial load
  useEffect(() => {
    if (!loading) {
      applyFilters();
    }
  }, [advancedFilters, searchTerm, loading]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // For now, use mock data. Replace with API call when ready
      setAllProducts(mockProducts);
      setProducts(mockProducts);
      // const response = await productsApi.getProducts();
      // setAllProducts(response.data);
      // setProducts(response.data);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('inventory.products.errors.loadFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Use allProducts if available, otherwise use current products as fallback
    const sourceData = allProducts.length > 0 ? allProducts : mockProducts;
    let filteredProducts = [...sourceData];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.model?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.kwCode?.toLowerCase().includes(searchLower)
      );
    }

    // Apply advanced filters
    filteredProducts = filteredProducts.filter(product => {
      return advancedFilters.every(filter => {
        if (!filter.column || !filter.operator) return true;
        
        const value = product[filter.column as keyof Product];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'is':
            return String(value).toLowerCase() === String(filterValue).toLowerCase();
          case 'is_not':
            return String(value).toLowerCase() !== String(filterValue).toLowerCase();
          case 'contains':
            return String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
          case 'not_contains':
            return !String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
          case 'starts_with':
            return String(value || '').toLowerCase().startsWith(String(filterValue || '').toLowerCase());
          case 'ends_with':
            return String(value || '').toLowerCase().endsWith(String(filterValue || '').toLowerCase());
          case 'is_empty':
            return !value || String(value).trim() === '';
          case 'is_not_empty':
            return value && String(value).trim() !== '';
          case 'greater_than':
            return Number(value) > Number(filterValue);
          case 'greater_than_equal':
            return Number(value) >= Number(filterValue);
          case 'less_than':
            return Number(value) < Number(filterValue);
          case 'less_than_equal':
            return Number(value) <= Number(filterValue);
          default:
            return true;
        }
      });
    });

    setProducts(filteredProducts);
  };

  const handleSearch = () => {
    applyFilters();
  };

  const clearAllFilters = () => {
    setAdvancedFilters([]);
    setSearchTerm('');
    const sourceData = allProducts.length > 0 ? allProducts : mockProducts;
    setProducts(sourceData);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getProductTypeLabel = (type: ProductType) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const columns = [
    {
      key: 'productType',
      title: t('inventory.products.columns.type'),
      render: (value: ProductType) => (
        <Badge variant="secondary">
          {getProductTypeLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'brand',
      title: t('inventory.products.columns.brand'),
      render: (value: string) => (
        <span className="font-medium">{value || '-'}</span>
      ),
    },
    {
      key: 'model',
      title: t('inventory.products.columns.model'),
      render: (value: string, record: Product) => (
        <div>
          <div className="font-medium">{value}</div>
          {record.kwCode && (
            <div className="text-sm text-muted-foreground">KW: {record.kwCode}</div>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      title: t('inventory.products.columns.description'),
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={value}>
            {value || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'dimensions',
      title: t('inventory.products.columns.dimensions'),
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm" title={value}>
            {value || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'features',
      title: t('inventory.products.columns.features'),
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={value}>
            {value || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'mapPrice',
      title: t('inventory.products.columns.mapPrice'),
      render: (value: number) => (
        <span className="font-medium text-green-600">{formatPrice(value)}</span>
      ),
    },
  ];

  const activeFiltersCount = advancedFilters.filter(f => f.column && f.operator).length;

  return (
    <div className="space-y-6">
      {/* Header with Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('inventory.products.searchPlaceholder')}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
                            <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    {t('actions.search')}
                  </Button>
          

        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedTableFilter
        columns={filterColumns}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
      />

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('inventory.products.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={products}
            columns={columns}
            loading={loading}
            onRowClick={(product) => console.log('View product details:', product)}
            title={t('inventory.products.results', { count: products.length })}
            description={t('inventory.products.resultsDescription')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
