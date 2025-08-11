import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { SalesOrdersSummary } from '@/modules/sales-inventory/components/SalesOrdersSummary';

export default function SalesOrders() {
  const { t } = useTranslation();
  
  return (
    <main className="w-full max-w-full">
      <div className="space-y-6">
        <Breadcrumbs items={[{ title: t('salesOrders') }]} />
        <SalesOrdersSummary />
      </div>
    </main>
  );
}