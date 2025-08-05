import { Breadcrumbs } from '@/components';
import { SalesOrdersHistory } from '@/modules/sales-inventory/components/SalesOrdersHistory';

export default function SalesOrdersHistoryPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { title: 'Sales Orders', href: '/store/sales-orders' },
        { title: 'History' }
      ]} />
      <SalesOrdersHistory />
    </div>
  );
}