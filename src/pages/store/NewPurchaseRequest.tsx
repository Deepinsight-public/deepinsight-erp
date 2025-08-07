import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { NewPurchaseRequest } from '@/modules/inventory/components/NewPurchaseRequest';

export default function NewPurchaseRequestPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { title: t('purchaseRequests'), href: '/store/purchase-requests' },
          { title: t('newPurchaseRequest.titleEn') }
        ]} 
      />
      <NewPurchaseRequest />
    </div>
  );
}