import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs, DataTable, StatusBadge } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventorySearch } from '@/modules/inventory/components/InventorySearch';
import { TransferManagement } from '@/modules/inventory/components/TransferManagement';
import { InventoryCount } from '@/modules/inventory/components/InventoryCount';

const mockInventoryItems = [
  {
    id: '1',
    productName: 'Wireless Bluetooth Headphones',
    sku: 'WBH-001',
    currentStock: 45,
    reservedStock: 5,
    availableStock: 40,
    minStockLevel: 10,
    status: 'active',
  },
  {
    id: '2',
    productName: 'USB-C Cable',
    sku: 'USC-002',
    currentStock: 8,
    reservedStock: 2,
    availableStock: 6,
    minStockLevel: 15,
    status: 'active',
  },
  {
    id: '3',
    productName: 'Laptop Stand',
    sku: 'LPS-003',
    currentStock: 25,
    reservedStock: 0,
    availableStock: 25,
    minStockLevel: 5,
    status: 'active',
  },
];

export default function Inventory() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const storeId = 'store-1'; // Would get from auth context

  const columns = [
    {
      key: 'productName',
      title: t('inventory.columns.product'),
      render: (value: string, record: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">SKU: {record.sku}</div>
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
      render: (value: number, record: any) => {
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
      render: (value: string, record: any) => {
        const isLowStock = record.availableStock <= record.minStockLevel;
        if (isLowStock) {
          return <Badge variant="destructive" className="text-xs">{t('inventory.status.lowStock')}</Badge>;
        }
        return <StatusBadge status={value as any} />;
      },
    },
  ];

  const handleRowClick = (item: any) => {
    console.log('Navigate to item:', item.id);
  };

  const lowStockItems = mockInventoryItems.filter(
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
            onSearch={(filters) => console.log('Search filters:', filters)}
            onExport={() => console.log('Exporting inventory...')}
          />
          <DataTable
            data={mockInventoryItems}
            columns={columns}
            onRowClick={handleRowClick}
            title={t('inventory.list.title')}
          />
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