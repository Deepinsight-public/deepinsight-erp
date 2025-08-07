import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Barcode, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardSearchBar, SearchBadge, SearchFilter } from '@/components/shared/StandardSearchBar';

interface InventorySearchProps {
  onSearch: (filters: any) => void;
  onExport: () => void;
}

export function InventorySearch({ onSearch, onExport }: InventorySearchProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const handleSearch = () => {
    onSearch({
      searchTerm,
      searchType,
      status: statusFilter === 'all' ? undefined : statusFilter,
      lowStock: stockFilter === 'low' ? true : undefined,
    });
  };

  const handleScanBarcode = () => {
    // Would integrate with barcode scanner
    console.log('Opening barcode scanner...');
  };

  const badges: SearchBadge[] = [
    { key: 'all', label: t('inventorySearch.badges.all'), active: searchType === 'all', onClick: () => setSearchType('all') },
    { key: 'sku', label: t('inventorySearch.badges.sku'), active: searchType === 'sku', onClick: () => setSearchType('sku') },
    { key: 'upc', label: t('inventorySearch.badges.upc'), active: searchType === 'upc', onClick: () => setSearchType('upc') },
    { key: 'model', label: t('inventorySearch.badges.model'), active: searchType === 'model', onClick: () => setSearchType('model') },
    { key: 'serial', label: t('inventorySearch.badges.serial'), active: searchType === 'serial', onClick: () => setSearchType('serial') },
  ];

  const filters: SearchFilter[] = [
    {
      key: 'status',
      label: t('inventorySearch.filters.status'),
      placeholder: t('inventorySearch.filters.status'),
      type: 'select',
      options: [
        { value: 'all', label: t('inventorySearch.filters.allStatus') },
        { value: 'active', label: t('inventorySearch.filters.active') },
        { value: 'discontinued', label: t('inventorySearch.filters.discontinued') },
        { value: 'blocked', label: t('inventorySearch.filters.blocked') },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'stock',
      label: t('inventorySearch.filters.stock'),
      placeholder: t('inventorySearch.filters.stock'),
      type: 'select',
      options: [
        { value: 'all', label: t('inventorySearch.filters.allStock') },
        { value: 'low', label: t('inventorySearch.filters.lowStock') },
        { value: 'out', label: t('inventorySearch.filters.outOfStock') },
        { value: 'overstock', label: t('inventorySearch.filters.overstock') },
      ],
      value: stockFilter,
      onChange: setStockFilter,
    },
  ];

  return (
    <div className="space-y-4">
      <StandardSearchBar
        title={t('inventory.search.title') || 'Product Search'}
        searchValue={searchTerm}
        searchPlaceholder={t('inventorySearch.placeholder', { type: searchType })}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        badges={badges}
        filters={filters}
        onExport={onExport}
        showExport={true}
      />
      <div className="flex justify-end">
        <Button onClick={handleScanBarcode} variant="outline">
          <Barcode className="h-4 w-4 mr-2" />
          {t('inventorySearch.scanBarcode')}
        </Button>
      </div>
    </div>
  );
}