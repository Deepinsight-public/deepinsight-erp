import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, Calendar } from 'lucide-react';

export default function LoadList() {
  const { t } = useTranslation();

  const loadData = [
    {
      id: '1',
      loadNumber: 'LD-2024-001',
      truck: 'TR-101',
      driver: 'John Smith',
      destination: 'Store #001',
      items: 45,
      weight: '2,150 kg',
      status: 'loading',
      scheduledDate: '2024-01-15',
    },
    {
      id: '2',
      loadNumber: 'LD-2024-002',
      truck: 'TR-102',
      driver: 'Mike Johnson',
      destination: 'Store #002',
      items: 32,
      weight: '1,840 kg',
      status: 'ready',
      scheduledDate: '2024-01-15',
    },
    {
      id: '3',
      loadNumber: 'LD-2024-003',
      truck: 'TR-103',
      driver: 'Sarah Davis',
      destination: 'Store #003',
      items: 28,
      weight: '1,520 kg',
      status: 'dispatched',
      scheduledDate: '2024-01-14',
    },
  ];

  const columns = [
    {
      key: 'loadNumber',
      title: t('warehouse.loadList.number', 'Load Number'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      key: 'truck',
      title: t('warehouse.loadList.truck', 'Truck'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'driver',
      title: t('warehouse.loadList.driver', 'Driver'),
      render: (value: string) => <div>{value}</div>,
    },
    {
      key: 'destination',
      title: t('warehouse.loadList.destination', 'Destination'),
      render: (value: string) => <div>{value}</div>,
    },
    {
      key: 'items',
      title: t('warehouse.loadList.items', 'Items'),
      render: (value: number) => <div>{value} items</div>,
    },
    {
      key: 'weight',
      title: t('warehouse.loadList.weight', 'Weight'),
      render: (value: string) => <div>{value}</div>,
    },
    {
      key: 'scheduledDate',
      title: t('warehouse.loadList.date', 'Date'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('warehouse.loadList.status', 'Status'),
      render: (value: string) => (
        <Badge 
          variant={
            value === 'dispatched' ? 'default' : 
            value === 'ready' ? 'secondary' : 
            'outline'
          }
        >
          {value === 'loading' ? 'Loading' : 
           value === 'ready' ? 'Ready' : 
           'Dispatched'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.loadList.title', 'Load List') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.loadList.title', 'Load List')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.loadList.description', 'Manage warehouse loading and dispatch operations')}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.loadList.allLoads', 'All Loads')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={loadData}
            columns={columns}
            onRowClick={(row) => console.log('Load selected:', row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}