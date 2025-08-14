import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AdvancedTableFilter, FilterRule, FilterColumn } from '../../sales-inventory/components/AdvancedTableFilter';

interface InventoryDatabaseProps {
  storeId: string;
}

interface InventoryItem {
  id: string;
  type: string;
  a4lCode: string;
  buyingPrice: number;
  price0: number;
  kwCode: string;
  loadNumber: string;
  loadDate: string;
  grade: string;
  model: string;
  inStock: boolean;
  location: string;
  mapPrice: number;
  itemNote: string;
  errorNote: string;
}

// Mock data based on the image provided
const mockInventoryData: InventoryItem[] = [
  {
    id: '1',
    type: 'WashTower',
    a4lCode: 'a4l4acdb9mo0',
    buyingPrice: 527.78,
    price0: 527.78,
    kwCode: 'KW0001128288',
    loadNumber: '100107',
    loadDate: '12/12/2024',
    grade: 'd_dentsrcr',
    model: 'WKE100HWY',
    inStock: true,
    location: 'N9-DE19BC',
    mapPrice: 2399.00,
    itemNote: 'Latest Return Note: No longer needed',
    errorNote: ''
  },
  {
    id: '2',
    type: 'WashTower',
    a4lCode: 'a4lw9ssi2lp',
    buyingPrice: 519.80,
    price0: 500.00,
    kwCode: '',
    loadNumber: '1574424',
    loadDate: '9/3/2024',
    grade: 'b_openbox',
    model: 'WKE100HWY',
    inStock: true,
    location: 'N9-DE19BC',
    mapPrice: 2599.00,
    itemNote: 'Latest Return Note: Arrived with damage wrong terminals wire burnt',
    errorNote: ''
  },
  {
    id: '3',
    type: 'Washer/Dryer',
    a4lCode: 'a4lv739qn7l',
    buyingPrice: 569.81,
    price0: 569.81,
    kwCode: 'KW0001149962',
    loadNumber: '103710',
    loadDate: '1/25/2025',
    grade: 's_asis',
    model: 'WM6998HYE',
    inStock: true,
    location: 'N9-DE19BC',
    mapPrice: 2999.00,
    itemNote: 'Latest Return Note: NO WORK',
    errorNote: ''
  },
  {
    id: '4',
    type: 'Refrigerator',
    a4lCode: 'a4l7zf0q2kl',
    buyingPrice: 166.03,
    price0: 166.03,
    kwCode: 'AA737169',
    loadNumber: '8Q2025056161812',
    loadDate: '6/6/2025',
    grade: 'x_no_grade',
    model: 'GNE25DSKSS',
    inStock: true,
    location: 'N9-DE19BC',
    mapPrice: 1099.00,
    itemNote: '',
    errorNote: ''
  },
  {
    id: '5',
    type: 'Refrigerator',
    a4lCode: 'a4lsshniw9jo',
    buyingPrice: 230.88,
    price0: 195.36,
    kwCode: 'KW0001093696',
    loadNumber: '93354',
    loadDate: '10/12/2024',
    grade: 'd_dentsrcr',
    model: 'LTCS2020S',
    inStock: true,
    location: 'N9-DE19BC',
    mapPrice: 888.00,
    itemNote: 'Latest Return Note: FRIDGE IS TOO BIG; CAME BACK TO PICK UP ANOTHER ONE',
    errorNote: ''
  }
];

export function InventoryDatabase({ storeId }: InventoryDatabaseProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterRule[]>([]);

  // Define filter columns based on the inventory table structure
  const filterColumns: FilterColumn[] = [
    { key: 'type', label: 'Type', dataType: 'text' },
    { key: 'a4lCode', label: 'A4L Code', dataType: 'text' },
    { key: 'buyingPrice', label: 'Buying Price', dataType: 'number' },
    { key: 'price0', label: 'Price0', dataType: 'number' },
    { key: 'kwCode', label: 'KW Code', dataType: 'text' },
    { key: 'loadNumber', label: 'Load #', dataType: 'text' },
    { key: 'loadDate', label: 'Load Date', dataType: 'date' },
    { 
      key: 'grade', 
      label: 'Grade', 
      dataType: 'select',
      options: [
        { value: 'd_dentsrcr', label: 'd_dentsrcr' },
        { value: 'b_openbox', label: 'b_openbox' },
        { value: 's_asis', label: 's_asis' },
        { value: 'x_no_grade', label: 'x_no_grade' },
      ]
    },
    { key: 'model', label: 'Model', dataType: 'text' },
    { 
      key: 'inStock', 
      label: 'In Stock?', 
      dataType: 'select',
      options: [
        { value: 'true', label: 'YES' },
        { value: 'false', label: 'NO' },
      ]
    },
    { key: 'location', label: 'Location', dataType: 'text' },
    { key: 'mapPrice', label: 'MAP Price', dataType: 'number' },
    { key: 'itemNote', label: 'Item Note', dataType: 'text' },
    { key: 'errorNote', label: 'Error Note', dataType: 'text' },
  ];

  // Load initial data
  useEffect(() => {
    loadInventory();
  }, []);

  // Apply filters when they change, but only after initial load
  useEffect(() => {
    if (!loading) {
      applyFilters();
    }
  }, [advancedFilters, searchTerm, loading]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      // For now, use mock data. Replace with API call when ready
      setAllInventory(mockInventoryData);
      setInventory(mockInventoryData);
      // const response = await inventoryApi.getInventory(storeId);
      // setAllInventory(response.data);
      // setInventory(response.data);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('inventory.database.errors.loadFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Use allInventory if available, otherwise use mock data as fallback
    const sourceData = allInventory.length > 0 ? allInventory : mockInventoryData;
    let filteredInventory = [...sourceData];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredInventory = filteredInventory.filter(item =>
        item.type?.toLowerCase().includes(searchLower) ||
        item.a4lCode?.toLowerCase().includes(searchLower) ||
        item.kwCode?.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower) ||
        item.itemNote?.toLowerCase().includes(searchLower)
      );
    }

    // Apply advanced filters
    filteredInventory = filteredInventory.filter(item => {
      return advancedFilters.every(filter => {
        if (!filter.column || !filter.operator) return true;
        
        const value = item[filter.column as keyof InventoryItem];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'is':
            if (filter.column === 'inStock') {
              return String(value) === String(filterValue);
            }
            return String(value).toLowerCase() === String(filterValue).toLowerCase();
          case 'is_not':
            if (filter.column === 'inStock') {
              return String(value) !== String(filterValue);
            }
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

    setInventory(filteredInventory);
  };

  const handleSearch = () => {
    applyFilters();
  };

  const clearAllFilters = () => {
    setAdvancedFilters([]);
    setSearchTerm('');
    const sourceData = allInventory.length > 0 ? allInventory : mockInventoryData;
    setInventory(sourceData);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getGradeBadge = (grade: string) => {
    const gradeVariants: Record<string, any> = {
      'd_dentsrcr': 'destructive',
      'b_openbox': 'secondary',
      's_asis': 'outline',
      'x_no_grade': 'default',
    };
    
    return (
      <Badge variant={gradeVariants[grade] || 'default'}>
        {grade}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'type',
      title: t('inventory.database.columns.type'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'a4lCode',
      title: t('inventory.database.columns.a4lCode'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'buyingPrice',
      title: t('inventory.database.columns.buyingPrice'),
      render: (value: number) => (
        <span className="font-medium">{formatPrice(value)}</span>
      ),
    },
    {
      key: 'price0',
      title: t('inventory.database.columns.price0'),
      render: (value: number) => (
        <span className="font-medium">{formatPrice(value)}</span>
      ),
    },
    {
      key: 'kwCode',
      title: t('inventory.database.columns.kwCode'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value || '-'}</span>
      ),
    },
    {
      key: 'loadNumber',
      title: t('inventory.database.columns.loadNumber'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'loadDate',
      title: t('inventory.database.columns.loadDate'),
      render: (value: string) => (
        <span className="text-sm">{value}</span>
      ),
    },
    {
      key: 'grade',
      title: t('inventory.database.columns.grade'),
      render: (value: string) => getGradeBadge(value),
    },
    {
      key: 'model',
      title: t('inventory.database.columns.model'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'inStock',
      title: t('inventory.database.columns.inStock'),
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'destructive'}>
          {value ? 'YES' : 'NO'}
        </Badge>
      ),
    },
    {
      key: 'location',
      title: t('inventory.database.columns.location'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'mapPrice',
      title: t('inventory.database.columns.mapPrice'),
      render: (value: number) => (
        <span className="font-medium text-green-600">{formatPrice(value)}</span>
      ),
    },
    {
      key: 'itemNote',
      title: t('inventory.database.columns.itemNote'),
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={value}>
            {value || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'errorNote',
      title: t('inventory.database.columns.errorNote'),
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate text-red-600" title={value}>
            {value || '-'}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('inventory.database.searchPlaceholder')}
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

      {/* Inventory Database Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('inventory.database.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={inventory}
            columns={columns}
            loading={loading}
            onRowClick={(item) => console.log('View inventory item details:', item)}
            title={t('inventory.database.results', { count: inventory.length })}
            description={t('inventory.database.resultsDescription')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
