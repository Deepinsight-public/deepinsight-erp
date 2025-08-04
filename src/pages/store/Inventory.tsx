import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs, DataTable, StatusBadge } from '@/components';
import { Badge } from '@/components/ui/badge';

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

  const columns = [
    {
      key: 'productName',
      title: 'Product',
      render: (value: string, record: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      key: 'currentStock',
      title: 'Current Stock',
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'availableStock',
      title: 'Available',
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
      title: 'Reserved',
      render: (value: number) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      key: 'minStockLevel',
      title: 'Min Level',
      render: (value: number) => (
        <span className="text-sm">{value}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string, record: any) => {
        const isLowStock = record.availableStock <= record.minStockLevel;
        if (isLowStock) {
          return <Badge variant="destructive" className="text-xs">Low Stock</Badge>;
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
            <h1 className="text-3xl font-bold">{t('inventory')}</h1>
            <p className="text-muted-foreground mt-2">
              Monitor stock levels and manage inventory transfers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              Transfer In
            </Button>
            <Button variant="outline">
              Transfer Out
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-medium text-warning">Low Stock Alert</h3>
          </div>
          <p className="text-sm text-warning/80">
            {lowStockItems.length} item(s) are below minimum stock level and need attention.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Filter</Button>
        <Button variant="outline">Export</Button>
      </div>

      <DataTable
        data={mockInventoryItems}
        columns={columns}
        onRowClick={handleRowClick}
      />
    </div>
  );
}