import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Download, Package, Barcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t('inventorySearch.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Type Selector */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={searchType === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('all')}
          >
            {t('inventorySearch.badges.all')}
          </Badge>
          <Badge
            variant={searchType === 'sku' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('sku')}
          >
            {t('inventorySearch.badges.sku')}
          </Badge>
          <Badge
            variant={searchType === 'upc' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('upc')}
          >
            {t('inventorySearch.badges.upc')}
          </Badge>
          <Badge
            variant={searchType === 'model' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('model')}
          >
            {t('inventorySearch.badges.model')}
          </Badge>
          <Badge
            variant={searchType === 'serial' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('serial')}
          >
            {t('inventorySearch.badges.serial')}
          </Badge>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('inventorySearch.placeholder', { type: searchType })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleScanBarcode} variant="outline">
            <Barcode className="h-4 w-4" />
          </Button>
          <Button onClick={handleSearch}>
            {t('actions.search')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('inventorySearch.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('inventorySearch.filters.allStatus')}</SelectItem>
              <SelectItem value="active">{t('inventorySearch.filters.active')}</SelectItem>
              <SelectItem value="discontinued">{t('inventorySearch.filters.discontinued')}</SelectItem>
              <SelectItem value="blocked">{t('inventorySearch.filters.blocked')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('inventorySearch.filters.stock')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('inventorySearch.filters.allStock')}</SelectItem>
              <SelectItem value="low">{t('inventorySearch.filters.lowStock')}</SelectItem>
              <SelectItem value="out">{t('inventorySearch.filters.outOfStock')}</SelectItem>
              <SelectItem value="overstock">{t('inventorySearch.filters.overstock')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('actions.export')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}