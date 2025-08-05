import { Breadcrumbs } from '@/components';
import { PurchaseRequestsList } from '@/modules/inventory/components/PurchaseRequestsList';

export default function PurchaseRequests() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ title: 'Purchase Requests' }]} />
      <PurchaseRequestsList />
    </div>
  );
}