import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Wholesale() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ title: t('warehouse.wholesale.title', 'Wholesale') }]} />
      <h1 className="text-3xl font-bold">{t('warehouse.wholesale.title', 'Wholesale')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Wholesale Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Wholesale functionality will be implemented here</p>
        </CardContent>
      </Card>
    </div>
  );
}