import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { StandardSearchBar } from '@/components/shared/StandardSearchBar';
import { searchProducts } from '../api/products';
import type { ProductSearchItem, ProductSearchFilters } from '../types';

export function OrderSearchPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductSearchItem[]>([]);
  const [originalProducts, setOriginalProducts] = useState<ProductSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProductSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = async (page = 1, isInitialLoad = false) => {
    setLoading(true);
    try {
      const result = await searchProducts({ 
        ...filters, 
        search: searchQuery || undefined, 
        page, 
        limit: 20 
      });
      setProducts(result.data);
      setTotal(result.total);
      setCurrentPage(page);
      
      // Store original data when no search query (initial load or cleared search)
      if (isInitialLoad || (!searchQuery && Object.keys(filters).length === 0)) {
        setOriginalProducts(result.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ProductSearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If search is cleared, clear all filters and restore original data immediately
    if (!value) {
      setFilters({});
      setProducts(originalProducts);
      setTotal(originalProducts.length);
      return;
    }
    
    // Debounce search for live updates
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(1);
    }, 300);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setProducts(originalProducts);
    setTotal(originalProducts.length);
  };

  useEffect(() => {
    handleSearch(1, true); // Initial load
  }, []);

  // Handle filter changes (excluding search query which is handled by handleSearchChange)
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      handleSearch(1);
    }
  }, [filters]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const columns = [
    {
      key: 'a4lCode' as keyof ProductSearchItem,
      title: t('search.columns.a4lCode'),
      sortable: true
    },
    {
      key: 'type' as keyof ProductSearchItem,
      title: t('search.columns.type'),
      sortable: true
    },
    {
      key: 'kwCode' as keyof ProductSearchItem,
      title: t('search.columns.kwCode'),
      sortable: true
    },
    {
      key: 'grade' as keyof ProductSearchItem,
      title: t('search.columns.grade'),
      sortable: true
    },
    {
      key: 'model' as keyof ProductSearchItem,
      title: t('search.columns.model'),
      sortable: true
    },
    {
      key: 'inStock' as keyof ProductSearchItem,
      title: t('search.columns.inStock'),
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'destructive'}>
          {value ? t('search.stockStatus.yes') : t('search.stockStatus.no')}
        </Badge>
      )
    },
    {
      key: 'mapPrice' as keyof ProductSearchItem,
      title: t('search.columns.mapPrice'),
      render: (value: number) => `$${value.toFixed(2)}`
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('search.title')}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {t('search.filters.toggle')}
        </Button>
      </div>

      <StandardSearchBar
        title={t('search.title') || 'Product Search'}
        searchValue={searchQuery}
        searchPlaceholder={t('search.placeholder')}
        onSearchChange={handleSearchChange}
        onSearch={() => handleSearch()}
        showExport={true}
        onExport={() => {
          // Export functionality placeholder
          console.log('Export products');
        }}
        badges={[
          {
            key: 'all',
            label: t('search.badges.all') || 'All Products',
            active: !filters.type,
            onClick: () => handleFilterChange('type', '')
          },
          {
            key: 'inStock',
            label: t('search.badges.inStock') || 'In Stock',
            active: filters.inStock === 'true',
            onClick: () => handleFilterChange('inStock', filters.inStock === 'true' ? '' : 'true')
          },
          {
            key: 'outOfStock',
            label: t('search.badges.outOfStock') || 'Out of Stock',
            active: filters.inStock === 'false',
            onClick: () => handleFilterChange('inStock', filters.inStock === 'false' ? '' : 'false')
          }
        ]}
        filters={showFilters ? [
          {
            key: 'kwCode',
            label: t('search.filters.kwCode'),
            placeholder: t('search.filters.kwCodePlaceholder'),
            type: 'input',
            value: filters.kwCode || '',
            onChange: (value) => handleFilterChange('kwCode', value),
          },
          {
            key: 'a4lCode',
            label: t('search.filters.a4lCode'),
            placeholder: t('search.filters.a4lCodePlaceholder'),
            type: 'input',
            value: filters.a4lCode || '',
            onChange: (value) => handleFilterChange('a4lCode', value),
          },
          {
            key: 'modelNumber',
            label: t('search.filters.modelNumber'),
            placeholder: t('search.filters.modelNumberPlaceholder'),
            type: 'input',
            value: filters.modelNumber || '',
            onChange: (value) => handleFilterChange('modelNumber', value),
          },
          {
            key: 'type',
            label: t('search.filters.type') || 'Product Type',
            placeholder: t('search.filters.typePlaceholder') || 'Select type...',
            type: 'select',
            value: filters.type || '',
            onChange: (value) => handleFilterChange('type', value),
            options: [
              { value: '', label: t('search.filters.allTypes') || 'All Types' },
              { value: 'appliance', label: t('search.types.appliance') || 'Appliance' },
              { value: 'part', label: t('search.types.part') || 'Part' },
              { value: 'accessory', label: t('search.types.accessory') || 'Accessory' }
            ]
          }
        ] : []}
      />

      <DataTable
        data={products}
        columns={columns}
        title={t('search.results', { count: total })}
        loading={loading}
      />
    </div>
  );
}