import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { SalesOrdersSummary } from '@/modules/sales-inventory/components/SalesOrdersSummary';

export default function SalesOrders() {
  const { t } = useTranslation();
  
  return (
    <main className="w-full max-w-full h-full min-h-0 flex flex-col">
      <div className="mb-4">
        <Breadcrumbs items={[{ title: t('salesOrders') }]} />
      </div>
      <div className="flex-1 min-h-0">
        <SalesOrdersSummary />
      </div>
    </main>
  );
}