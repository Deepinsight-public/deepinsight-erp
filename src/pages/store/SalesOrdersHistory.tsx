import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { SalesOrdersHistory } from '@/modules/sales-inventory/components/SalesOrdersHistory';

export default function SalesOrdersHistoryPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { title: t('salesOrders'), href: '/store/sales-orders' },
        { title: t('pages.history') }
      ]} />
      <SalesOrdersHistory />
    </div>
  );
}