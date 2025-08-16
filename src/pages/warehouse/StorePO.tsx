import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StorePO() {
  const { t } = useTranslation();

  const poData = [
    {
      id: '1',
      poNumber: 'PO-2024-001',
      store: 'Store #001',
      date: '2024-01-15',
      items: 25,
      total: 12500,
      status: 'pending',
    },
    {
      id: '2',
      poNumber: 'PO-2024-002',
      store: 'Store #002',
      date: '2024-01-14',
      items: 18,
      total: 8900,
      status: 'approved',
    },
    {
      id: '3',
      poNumber: 'PO-2024-003',
      store: 'Store #003',
      date: '2024-01-14',
      items: 32,
      total: 15600,
      status: 'shipped',
    },
    {
      id: '4',
      poNumber: 'PO-2024-004',
      store: 'Store #001',
      date: '2024-01-13',
      items: 22,
      total: 11200,
      status: 'delivered',
    },
  ];

  const columns = [
    {
      key: 'poNumber',
      title: t('warehouse.po.number', 'PO Number'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      key: 'store',
      title: t('warehouse.po.store', 'Store'),
      render: (value: string) => <div>{value}</div>,
    },
    {
      key: 'date',
      title: t('warehouse.po.date', 'Date'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'items',
      title: t('warehouse.po.items', 'Items'),
      render: (value: number) => <div>{value} items</div>,
    },
    {
      key: 'total',
      title: t('warehouse.po.total', 'Total'),
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">${value.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('warehouse.po.status', 'Status'),
      render: (value: string) => (
        <Badge 
          variant={
            value === 'delivered' ? 'default' : 
            value === 'shipped' ? 'secondary' : 
            value === 'approved' ? 'outline' :
            'destructive'
          }
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.po.title', 'Store Purchase Orders') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.po.title', 'Store Purchase Orders')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.po.description', 'Manage purchase orders from stores')}
            </p>
          </div>
          <Button asChild>
            <Link to="/warehouse/store-po/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('warehouse.po.create', 'Create PO')}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.po.allOrders', 'All Purchase Orders')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={poData}
            columns={columns}
            onRowClick={(row) => console.log('PO selected:', row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}