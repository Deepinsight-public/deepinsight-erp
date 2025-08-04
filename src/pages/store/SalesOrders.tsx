import { Breadcrumbs } from '@/components';
import { SalesOrdersList } from '@/modules/sales-inventory/components/SalesOrdersList';

export default function SalesOrders() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ title: 'Sales Orders' }]} />
      <SalesOrdersList />
    </div>
  );
}