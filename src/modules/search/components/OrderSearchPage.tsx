import { useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProductSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [originalProducts, setOriginalProducts] = useState<ProductSearchItem[]>([]);

  const handleSearch = async (page = 1, searchParams?: { search?: string; filters?: ProductSearchFilters }) => {
    setLoading(true);
    try {
      const params = searchParams || { search: searchQuery || undefined, filters };
      const result = await searchProducts({ 
        ...params.filters, 
        search: params.search, 
        page, 
        limit: 20 
      });
      setProducts(result.data);
      setTotal(result.total);
      setCurrentPage(page);
      
      // Store original data when no search or filters are applied
      if (!params.search && (!params.filters || Object.keys(params.filters).length === 0)) {
        setOriginalProducts(result.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSearch(1, { search: searchValue || undefined, filters });
        }, 300);
      };
    })(),
    [filters]
  );

  const handleFilterChange = (key: keyof ProductSearchFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined
    };
    setFilters(newFilters);
    
    // Trigger search with new filters
    handleSearch(1, { search: searchQuery || undefined, filters: newFilters });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // If search is cleared, reload original data
    if (!value.trim()) {
      setFilters({});
      // Reload original data instead of using stored state
      handleSearch(1, { search: undefined, filters: {} });
    } else {
      // Trigger debounced search
      debouncedSearch(value);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    // Reload original data when clearing
    handleSearch(1, { search: undefined, filters: {} });
  };

  // Load initial data
  useEffect(() => {
    handleSearch(1, { search: undefined, filters: {} });
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
        onSearch={() => handleSearch(1)}
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