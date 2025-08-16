import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Store, Phone, MapPin } from 'lucide-react';

export default function StoreManagement() {
  const { t } = useTranslation();

  const storesData = [
    {
      id: '1',
      name: 'Store #001 - Downtown',
      manager: 'John Smith',
      phone: '+1 234-567-8901',
      address: '123 Main St, Downtown',
      status: 'active',
      inventory: 1250,
      lastSync: '2024-01-15 10:30',
    },
    {
      id: '2',
      name: 'Store #002 - Mall',
      manager: 'Sarah Johnson',
      phone: '+1 234-567-8902',
      address: '456 Mall Ave, Shopping Center',
      status: 'active',
      inventory: 980,
      lastSync: '2024-01-15 09:45',
    },
    {
      id: '3',
      name: 'Store #003 - Suburban',
      manager: 'Mike Davis',
      phone: '+1 234-567-8903',
      address: '789 Suburban Rd, Residential',
      status: 'maintenance',
      inventory: 750,
      lastSync: '2024-01-14 16:20',
    },
  ];

  const columns = [
    {
      key: 'name',
      title: t('warehouse.stores.name', 'Store Name'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      key: 'manager',
      title: t('warehouse.stores.manager', 'Manager'),
      render: (value: string) => <div>{value}</div>,
    },
    {
      key: 'phone',
      title: t('warehouse.stores.phone', 'Phone'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'address',
      title: t('warehouse.stores.address', 'Address'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('warehouse.stores.status', 'Status'),
      render: (value: string) => (
        <Badge 
          variant={
            value === 'active' ? 'default' : 
            value === 'maintenance' ? 'secondary' : 
            'destructive'
          }
        >
          {value === 'active' ? 'Active' : 
           value === 'maintenance' ? 'Maintenance' : 
           'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'inventory',
      title: t('warehouse.stores.inventory', 'Inventory'),
      render: (value: number) => (
        <div className="text-right">{value.toLocaleString()} items</div>
      ),
    },
    {
      key: 'lastSync',
      title: t('warehouse.stores.lastSync', 'Last Sync'),
      render: (value: string) => (
        <div className="text-sm text-muted-foreground">{value}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.stores.title', 'Store Management') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.stores.title', 'Store Management')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.stores.description', 'Manage and monitor all connected stores')}
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('warehouse.stores.addStore', 'Add Store')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.stores.allStores', 'All Stores')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={storesData}
            columns={columns}
            onRowClick={(row) => console.log('Store selected:', row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}