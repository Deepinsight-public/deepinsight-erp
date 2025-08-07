import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { RecentOrdersList } from '@/modules/sales-inventory/components/RecentOrdersList';

export default function SalesOrders() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ title: t('salesOrders') }]} />
      <RecentOrdersList />
    </div>
  );
}