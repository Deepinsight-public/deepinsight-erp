import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernKPIWidget } from '@/components/shared/ModernKPIWidget';
import { Package, ArrowDown, ArrowUp } from 'lucide-react';

export default function Inventory() {
  const { t } = useTranslation();

  const kpiData = [
    {
      title: t('warehouse.inventory.totalItems', 'Total Items'),
      value: '45,672',
      change: { value: 2.3, label: '%' },
      icon: Package,
    },
    {
      title: t('warehouse.inventory.transfersIn', 'Transfers In'),
      value: '234',
      change: { value: 12, label: '%' },
      icon: ArrowDown,
    },
    {
      title: t('warehouse.inventory.transfersOut', 'Transfers Out'),
      value: '187',
      change: { value: 8, label: '%' },
      icon: ArrowUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.inventory.title', 'Inventory') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.inventory.title', 'Inventory Management')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.inventory.description', 'Manage warehouse inventory and transfers')}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t('warehouse.inventory.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="transfer-in">{t('warehouse.inventory.transferIn', 'Transfer In')}</TabsTrigger>
          <TabsTrigger value="transfer-out">{t('warehouse.inventory.transferOut', 'Transfer Out')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse.inventory.warehouseStock', 'Warehouse Stock Overview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('warehouse.inventory.overviewPlaceholder', 'Inventory overview will be implemented here')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer-in" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse.inventory.transferInTitle', 'Transfer In Management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('warehouse.inventory.transferInPlaceholder', 'Transfer in functionality will be implemented here')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer-out" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse.inventory.transferOutTitle', 'Transfer Out Management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('warehouse.inventory.transferOutPlaceholder', 'Transfer out functionality will be implemented here')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}