import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernKPIWidget } from '@/components/shared/ModernKPIWidget';
import { RefreshCw, Trash2, ArrowLeft } from 'lucide-react';

export default function AfterSales() {
  const { t } = useTranslation();

  const kpiData = [
    {
      title: t('warehouse.afterSales.totalReturns', 'Total Returns'),
      value: '234',
      change: { value: 5.2, label: '%' },
      icon: RefreshCw,
    },
    {
      title: t('warehouse.afterSales.scrapItems', 'Scrap Items'),
      value: '45',
      change: { value: -2.1, label: '%' },
      icon: Trash2,
    },
    {
      title: t('warehouse.afterSales.processing', 'Processing'),
      value: '89',
      change: { value: 8.3, label: '%' },
      icon: ArrowLeft,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.afterSales.title', 'After Sales') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.afterSales.title', 'After Sales Management')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.afterSales.description', 'Manage returns, scrap items, and after-sales processing')}
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

      <Tabs defaultValue="returns" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="returns">{t('warehouse.afterSales.returns', 'Returns')}</TabsTrigger>
          <TabsTrigger value="scrap">{t('warehouse.afterSales.scrap', 'Scrap')}</TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse.afterSales.returnsManagement', 'Returns Management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('warehouse.afterSales.returnsPlaceholder', 'Returns management functionality will be implemented here')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scrap" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('warehouse.afterSales.scrapManagement', 'Scrap Management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('warehouse.afterSales.scrapPlaceholder', 'Scrap management functionality will be implemented here')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}