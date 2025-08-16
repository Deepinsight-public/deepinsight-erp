import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewWholesale() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { title: t('warehouse.wholesale.title', 'Wholesale') },
        { title: t('warehouse.wholesale.new', 'New') }
      ]} />
      <h1 className="text-3xl font-bold">{t('warehouse.wholesale.new', 'New Wholesale Order')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create Wholesale Order</CardTitle>
        </CardHeader>
        <CardContent>
          <p>New wholesale order form will be implemented here</p>
        </CardContent>
      </Card>
    </div>
  );
}