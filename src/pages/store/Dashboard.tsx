import { useTranslation } from 'react-i18next';
import { TrendingUp, ShoppingCart, Package, Users, DollarSign } from 'lucide-react';
import { Breadcrumbs, KPIWidget, ChartWidget } from '@/components';

const mockKPIData = [
  {
    titleKey: 'dashboard.kpi.totalSales',
    value: 45680,
    icon: DollarSign,
    change: { value: 12.5, period: 'last month' },
    trend: 'up' as const,
    format: 'currency' as const,
    color: 'success' as const,
  },
  {
    titleKey: 'dashboard.kpi.ordersToday',
    value: 28,
    icon: ShoppingCart,
    change: { value: -5.2, period: 'yesterday' },
    trend: 'down' as const,
    color: 'primary' as const,
  },
  {
    titleKey: 'dashboard.kpi.lowStockItems',
    value: 15,
    icon: Package,
    change: { value: 3.1, period: 'last week' },
    trend: 'up' as const,
    color: 'warning' as const,
  },
  {
    titleKey: 'dashboard.kpi.activeCustomers',
    value: 1248,
    icon: Users,
    change: { value: 8.7, period: 'last month' },
    trend: 'up' as const,
    color: 'primary' as const,
  },
];

const mockSalesData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

const mockCategoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Home & Garden', value: 20 },
  { name: 'Sports', value: 15 },
  { name: 'Other', value: 5 },
];

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('dashboard') }]} />
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('dashboard.welcome')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockKPIData.map((kpi, index) => (
          <KPIWidget
            key={index}
            title={t(kpi.titleKey)}
            value={kpi.value}
            icon={kpi.icon}
            change={kpi.change}
            trend={kpi.trend}
            format={kpi.format}
            color={kpi.color}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title={t('dashboard.charts.monthlySales')}
          data={mockSalesData}
          type="line"
          xAxisKey="name"
          yAxisKey="value"
          color="#3b82f6"
        />
        
        <ChartWidget
          title={t('dashboard.charts.salesByCategory')}
          data={mockCategoryData}
          type="pie"
          xAxisKey="name"
          yAxisKey="value"
        />
      </div>

      {/* Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.recent.orders')}</h3>
          <p className="text-muted-foreground">
            {t('dashboard.recent.ordersDesc')}
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.inventory.alerts')}</h3>
          <p className="text-muted-foreground">
            {t('dashboard.inventory.alertsDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}