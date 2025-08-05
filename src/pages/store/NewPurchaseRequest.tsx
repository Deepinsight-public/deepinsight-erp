import { Breadcrumbs } from '@/components';
import { NewPurchaseRequest } from '@/modules/inventory/components/NewPurchaseRequest';

export default function NewPurchaseRequestPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { title: 'Purchase Requests', href: '/store/purchase-requests' },
          { title: 'New Request' }
        ]} 
      />
      <NewPurchaseRequest />
    </div>
  );
}