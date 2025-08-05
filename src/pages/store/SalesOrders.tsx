import { Breadcrumbs } from '@/components';
import { RecentOrdersList } from '@/modules/sales-inventory/components/RecentOrdersList';

export default function SalesOrders() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ title: 'Sales Orders' }]} />
      <RecentOrdersList />
    </div>
  );
}