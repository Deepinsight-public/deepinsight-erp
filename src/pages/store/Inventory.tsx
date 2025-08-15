import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs, DataTable, StatusBadge, LoadingOverlay } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventorySearch } from '@/modules/inventory/components/InventorySearch';
import { TransferManagement } from '@/modules/inventory/components/TransferManagement';
import { InventoryCount } from '@/modules/inventory/components/InventoryCount';
import { inventoryApi } from '@/modules/inventory/api/inventory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { InventoryItem, InventorySearchFilters } from '@/modules/inventory/types';



export default function Inventory() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InventorySearchFilters>({});
  
  const storeId = profile?.store_id || 'default-store';

  useEffect(() => {
    if (profile?.store_id) {
      loadInventoryData();
    }
  }, [profile?.store_id]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      console.log('Loading inventory for store:', storeId);
      const data = await inventoryApi.getInventory(storeId, filters);
      console.log('Inventory data loaded:', data?.length, 'items');
      console.log('Sample inventory item:', data?.[0]);
      setInventoryItems(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchFilters: InventorySearchFilters) => {
    setFilters(searchFilters);
    setLoading(true);
    try {
      const data = await inventoryApi.getInventory(storeId, searchFilters);
      setInventoryItems(data);
    } catch (error) {
      console.error('Error searching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to search inventory',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'a4lCode',
      title: 'A4L Code',
      render: (value: string, record: InventoryItem) => (
        <div className="font-mono text-sm font-medium">
          {value || `A4L-${record.sku}-001`}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'kwCode',
      title: 'KW Code',
      render: (value: string, record: InventoryItem) => (
        <div className="font-mono text-sm">
          {value || 'KW-GEN'}
          {!value && (
            <span className="text-xs text-muted-foreground ml-1">(generated)</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'productName',
      title: t('inventory.columns.product'),
      render: (value: string, record: InventoryItem) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">SKU: {record.sku}</div>
          {record.brand && (
            <div className="text-xs text-muted-foreground">{record.brand} {record.model}</div>
          )}
        </div>
      ),
    },
    {
      key: 'currentStock',
      title: t('inventory.columns.currentStock'),
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'availableStock',
      title: t('inventory.columns.available'),
      render: (value: number, record: InventoryItem) => {
        const isLowStock = value <= record.minStockLevel;
        return (
          <div className="flex items-center gap-2">
            <span className={isLowStock ? 'text-warning font-medium' : 'font-medium'}>
              {value}
            </span>
            {isLowStock && (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
          </div>
        );
      },
    },
    {
      key: 'reservedStock',
      title: t('inventory.columns.reserved'),
      render: (value: number) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      key: 'minStockLevel',
      title: t('inventory.columns.minLevel'),
      render: (value: number) => (
        <span className="text-sm">{value}</span>
      ),
    },
    {
      key: 'status',
      title: t('inventory.columns.status'),
      render: (value: string, record: InventoryItem) => {
        const isLowStock = record.availableStock <= record.minStockLevel;
        if (isLowStock) {
          return <Badge variant="destructive" className="text-xs">{t('inventory.status.lowStock')}</Badge>;
        }
        return <StatusBadge status={value as any} />;
      },
    },
  ];

  const handleRowClick = (item: InventoryItem) => {
    // Navigate to item detail page using the product ID
    window.location.href = `/store/items/${item.productId}`;
  };

  const lowStockItems = inventoryItems.filter(
    item => item.availableStock <= item.minStockLevel
  );

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('inventory') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('inventory.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-medium text-warning">{t('inventory.lowStockAlert.title')}</h3>
          </div>
          <p className="text-sm text-warning/80">
            {t('inventory.lowStockAlert.description', { count: lowStockItems.length })}
          </p>
        </div>
      )}

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">{t('inventory.tabs.search')}</TabsTrigger>
          <TabsTrigger value="transfers">{t('inventory.tabs.transfers')}</TabsTrigger>
          <TabsTrigger value="counts">{t('inventory.tabs.counts')}</TabsTrigger>
          <TabsTrigger value="purchase">{t('inventory.tabs.purchase')}</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6 space-y-6">
          <InventorySearch 
            onSearch={handleSearch}
            onExport={() => console.log('Exporting inventory...')}
          />
          {loading ? (
            <LoadingOverlay />
          ) : inventoryItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inventory items found for this store</p>
              <p className="text-sm">Check your store configuration or add products to inventory</p>
            </div>
          ) : (
            <DataTable
              data={inventoryItems}
              columns={columns}
              onRowClick={handleRowClick}
              title={t('inventory.list.title')}
            />
          )}
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          <TransferManagement storeId={storeId} />
        </TabsContent>

        <TabsContent value="counts" className="mt-6">
          <InventoryCount storeId={storeId} />
        </TabsContent>

        <TabsContent value="purchase" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('inventory.purchase.message')}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/store/purchase-requests'}>
              {t('inventory.purchase.goToRequests')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}