import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { ModernKPIWidget } from '@/components/shared/ModernKPIWidget';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Store,
} from 'lucide-react';

export default function SalesSummary() {
  const { t } = useTranslation();

  const kpiData = [
    {
      title: t('warehouse.sales.totalRevenue', 'Total Revenue'),
      value: '$1,284,592',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      title: t('warehouse.sales.unitsSold', 'Units Sold'),
      value: '8,247',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Package,
    },
    {
      title: t('warehouse.sales.avgOrderValue', 'Avg Order Value'),
      value: '$156',
      change: '+3.1%',
      trend: 'up' as const,
      icon: TrendingUp,
    },
    {
      title: t('warehouse.sales.activeStores', 'Active Stores'),
      value: '24',
      change: '+2',
      trend: 'up' as const,
      icon: Store,
    },
  ];

  const salesData = [
    {
      id: '1',
      store: 'Store #001',
      revenue: 45850,
      units: 320,
      avgOrder: 143.28,
      growth: 12.5,
      status: 'excellent',
    },
    {
      id: '2',
      store: 'Store #002',
      revenue: 38420,
      units: 285,
      avgOrder: 134.81,
      growth: 8.2,
      status: 'good',
    },
    {
      id: '3',
      store: 'Store #003',
      revenue: 52100,
      units: 365,
      avgOrder: 142.74,
      growth: 15.3,
      status: 'excellent',
    },
    {
      id: '4',
      store: 'Store #004',
      revenue: 29800,
      units: 198,
      avgOrder: 150.51,
      growth: -2.1,
      status: 'needs_attention',
    },
  ];

  const columns = [
    {
      key: 'store',
      title: t('warehouse.sales.store', 'Store'),
      render: (value: string) => (
        <div className="font-medium">{value}</div>
      ),
    },
    {
      key: 'revenue',
      title: t('warehouse.sales.revenue', 'Revenue'),
      render: (value: number) => (
        <div className="font-medium">${value.toLocaleString()}</div>
      ),
    },
    {
      key: 'units',
      title: t('warehouse.sales.units', 'Units'),
      render: (value: number) => (
        <div>{value.toLocaleString()}</div>
      ),
    },
    {
      key: 'avgOrder',
      title: t('warehouse.sales.avgOrder', 'Avg Order'),
      render: (value: number) => (
        <div>${value.toFixed(2)}</div>
      ),
    },
    {
      key: 'growth',
      title: t('warehouse.sales.growth', 'Growth'),
      render: (value: number) => (
        <div className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value >= 0 ? '+' : ''}{value}%
        </div>
      ),
    },
    {
      key: 'status',
      title: t('warehouse.sales.status', 'Status'),
      render: (value: string) => (
        <Badge 
          variant={
            value === 'excellent' ? 'default' : 
            value === 'good' ? 'secondary' : 
            'destructive'
          }
        >
          {value === 'excellent' ? 'Excellent' : 
           value === 'good' ? 'Good' : 
           'Needs Attention'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.sales.title', 'Sales Summary') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.sales.title', 'Sales Summary')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.sales.description', 'Overview of sales performance across all stores')}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <ModernKPIWidget
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.sales.storePerformance', 'Store Performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={salesData}
            columns={columns}
            onRowClick={(row) => console.log('Store selected:', row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}