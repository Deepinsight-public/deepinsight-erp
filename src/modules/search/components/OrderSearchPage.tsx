import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { searchProducts } from '../api/products';
import type { ProductSearchItem, ProductSearchFilters } from '../types';

export function OrderSearchPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProductSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const handleSearch = async (page = 1) => {
    setLoading(true);
    try {
      const result = await searchProducts({ ...filters, page, limit: 20 });
      setProducts(result.data);
      setTotal(result.total);
      setCurrentPage(page);
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

  const clearFilters = () => {
    setFilters({});
  };

  useEffect(() => {
    handleSearch();
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

      <Card>
        <CardHeader>
          <CardTitle>{t('search.productSearch')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Input
                placeholder={t('search.placeholder')}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button onClick={() => handleSearch()}>
              <Search className="h-4 w-4 mr-2" />
              {t('search.searchButton')}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="kwCode">{t('search.filters.kwCode')}</Label>
                <Input
                  id="kwCode"
                  value={filters.kwCode || ''}
                  onChange={(e) => handleFilterChange('kwCode', e.target.value)}
                  placeholder={t('search.filters.kwCodePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a4lCode">{t('search.filters.a4lCode')}</Label>
                <Input
                  id="a4lCode"
                  value={filters.a4lCode || ''}
                  onChange={(e) => handleFilterChange('a4lCode', e.target.value)}
                  placeholder={t('search.filters.a4lCodePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelNumber">{t('search.filters.modelNumber')}</Label>
                <Input
                  id="modelNumber"
                  value={filters.modelNumber || ''}
                  onChange={(e) => handleFilterChange('modelNumber', e.target.value)}
                  placeholder={t('search.filters.modelNumberPlaceholder')}
                />
              </div>
              <div className="md:col-span-3 flex justify-end space-x-2">
                <Button variant="outline" onClick={clearFilters}>
                  {t('search.filters.clear')}
                </Button>
                <Button onClick={() => handleSearch()}>
                  {t('search.filters.apply')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DataTable
        data={products}
        columns={columns}
        title={t('search.results', { count: total })}
        loading={loading}
      />
    </div>
  );
}