import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { ModernKPIWidget } from '@/components/shared/ModernKPIWidget';
import { EarningsChart } from '@/components/shared/EarningsChart';
import { OrdersOverviewChart } from '@/components/shared/OrdersOverviewChart';
import { 
  Package, 
  Truck, 
  Store, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WarehouseDashboard() {
  const { t } = useTranslation();

  const kpiData = [
    {
      title: t('warehouse.dashboard.totalInventory', 'Total Inventory'),
      value: '125,847',
      change: { value: 5.2, label: '%' },
      trend: 'up' as const,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: t('warehouse.dashboard.activeStores', 'Active Stores'),
      value: '24',
      change: { value: 2, label: 'new' },
      trend: 'up' as const,
      icon: Store,
      color: 'text-green-600',
    },
    {
      title: t('warehouse.dashboard.shipments', 'Shipments Today'),
      value: '156',
      change: { value: 12.3, label: '%' },
      trend: 'up' as const,
      icon: Truck,
      color: 'text-purple-600',
    },
    {
      title: t('warehouse.dashboard.revenue', 'Monthly Revenue'),
      value: '$284,592',
      change: { value: 8.1, label: '%' },
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.dashboard.title', 'Warehouse Dashboard') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.dashboard.title', 'Warehouse Dashboard')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.dashboard.description', 'Monitor warehouse operations and performance')}
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
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsChart />
        <OrdersOverviewChart />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('warehouse.dashboard.recentActivity', 'Recent Activity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: 'Shipment to Store #12',
                details: '45 items dispatched',
                time: '2 hours ago',
                icon: ArrowUpRight,
                color: 'text-green-600',
              },
              {
                action: 'Inventory restock',
                details: 'Added 200 units to SKU-001',
                time: '4 hours ago',
                icon: Package,
                color: 'text-blue-600',
              },
              {
                action: 'Return processing',
                details: '12 items received from Store #8',
                time: '6 hours ago',
                icon: ArrowDownRight,
                color: 'text-orange-600',
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <activity.icon className={`h-5 w-5 mt-0.5 ${activity.color}`} />
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}