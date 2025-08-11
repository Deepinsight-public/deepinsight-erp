import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Barcode, Package, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { inventoryApi } from '@/modules/inventory/api/inventory';
import type { InventoryItem as ExistingInventoryItem, InventorySearchFilters as ExistingFilters } from '@/modules/inventory/types';

interface InventorySearchAdvancedProps {
  storeId: string;
  onExport?: () => void;
}

export function InventorySearchAdvanced({ storeId, onExport }: InventorySearchAdvancedProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'a4l' | 'kw' | 'model' | 'epc'>('a4l');
  const [status, setStatus] = useState<string>('');
  const [currentStoreOnly, setCurrentStoreOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ExistingInventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemEvents, setItemEvents] = useState<ItemEvent[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const searchOptions = [
    { value: 'a4l', label: 'A4L Code', icon: Package },
    { value: 'kw', label: 'Keyword/Name', icon: Search },
    { value: 'model', label: 'Model', icon: Package },
    { value: 'epc', label: 'EPC', icon: Barcode },
  ];

  const statusOptions = [
    { value: '', label: t('inventory.filters.allStatus') },
    { value: 'in_stock', label: t('inventory.filters.inStock') },
    { value: 'in_transit', label: t('inventory.filters.inTransit') },
    { value: 'pending', label: t('inventory.filters.pending') },
  ];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filters: InventorySearchFilters = {
        q: searchTerm.trim() || undefined,
        by: searchBy,
        status: status || undefined,
        currentStoreOnly,
        limit: 50,
      };
      
      const data = await inventoryApi.getInventory(storeId, filters);
      setItems(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (item: InventoryItem) => {
    setSelectedItem(item);
    setLoading(true);
    try {
      const events = await inventoryApi.getItemEvents(item.id);
      setItemEvents(events);
    } catch (error) {
      console.error('Failed to load item events:', error);
      setItemEvents([]);
    } finally {
      setLoading(false);
      setDrawerOpen(true);
    }
  };

  const calculateDaysOnHand = (loadDate?: string) => {
    if (!loadDate) return null;
    const days = Math.floor((Date.now() - new Date(loadDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const columns = [
    {
      key: 'a4lCode',
      title: t('inventory.columns.a4lCode'),
      render: (value: string) => (
        <span className="font-mono font-medium">{value}</span>
      ),
    },
    {
      key: 'epc',
      title: t('inventory.columns.epc'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'serialNo',
      title: t('inventory.columns.serial'),
      render: (value: string) => value || '-',
    },
    {
      key: 'productName',
      title: t('inventory.columns.product'),
      render: (value: string, record: InventoryItem) => (
        <div>
          <div className="font-medium">{value || record.sku}</div>
          <div className="text-sm text-muted-foreground">
            {record.brand} {record.model}
          </div>
        </div>
      ),
    },
    {
      key: 'gradeLabel',
      title: t('inventory.columns.grade'),
      render: (value: string) => value ? (
        <Badge variant="outline">{value}</Badge>
      ) : '-',
    },
    {
      key: 'status',
      title: t('inventory.columns.status'),
      render: (value: string) => {
        const statusColors = {
          in_stock: 'bg-success/10 text-success',
          in_transit: 'bg-warning/10 text-warning',
          pending: 'bg-gray/10 text-gray',
          sold: 'bg-primary/10 text-primary',
          returned: 'bg-danger/10 text-danger',
          scrapped: 'bg-danger/10 text-danger',
        };
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray/10 text-gray'}>
            {t(`inventory.status.${value}`)}
          </Badge>
        );
      },
    },
    {
      key: 'currentStoreId',
      title: t('inventory.columns.location'),
      render: (value: string) => value ? (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="text-sm">{value}</span>
        </div>
      ) : '-',
    },
    {
      key: 'loadDate',
      title: t('inventory.columns.daysOnHand'),
      render: (value: string) => {
        const days = calculateDaysOnHand(value);
        return days !== null ? (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-sm">{days}d</span>
          </div>
        ) : '-';
      },
    },
  ];

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || status || currentStoreOnly) {
        handleSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchBy, status, currentStoreOnly]);

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[300px] space-y-2">
            <Label>{t('inventory.search.searchTerm')}</Label>
            <div className="flex gap-2">
              <Select value={searchBy} onValueChange={(value: any) => setSearchBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {searchOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Input
                placeholder={t('inventory.search.placeholder', { type: searchBy.toUpperCase() })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('inventory.search.status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="current-store"
              checked={currentStoreOnly}
              onCheckedChange={setCurrentStoreOnly}
            />
            <Label htmlFor="current-store">{t('inventory.search.currentStoreOnly')}</Label>
          </div>

          {onExport && (
            <Button variant="outline" onClick={onExport}>
              {t('inventory.actions.export')}
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {t('inventory.search.hint')}
        </div>
      </div>

      {/* Results Table */}
      <DataTable
        data={items}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        title={t('inventory.search.results', { count: items.length })}
        
      />

      {/* Item Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>
              {selectedItem ? t('inventory.itemDetail.title', { code: selectedItem.a4lCode }) : ''}
            </DrawerTitle>
          </DrawerHeader>
          
          {selectedItem && (
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.a4lCode')}</Label>
                  <div className="font-mono font-medium">{selectedItem.a4lCode}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.epc')}</Label>
                  <div className="font-mono text-sm">{selectedItem.epc}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.serial')}</Label>
                  <div>{selectedItem.serialNo || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.status')}</Label>
                  <Badge className="mt-1">{t(`inventory.status.${selectedItem.status}`)}</Badge>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <Label className="text-sm font-medium">{t('inventory.itemDetail.productInfo')}</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.productName')}</Label>
                      <div>{selectedItem.productName || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.brand')}</Label>
                      <div>{selectedItem.brand || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.model')}</Label>
                      <div>{selectedItem.model || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('inventory.itemDetail.sku')}</Label>
                      <div>{selectedItem.sku || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Events Timeline */}
              <div>
                <Label className="text-sm font-medium">{t('inventory.itemDetail.eventsTimeline')}</Label>
                <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {itemEvents.length > 0 ? (
                    itemEvents.map((event, index) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{event.type}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {event.docType && (
                            <div className="text-sm text-muted-foreground">
                              {event.docType}: {event.docNo || event.docId}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('inventory.itemDetail.noEvents')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}