import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { PurchaseRequestsList } from '@/modules/inventory/components/PurchaseRequestsList';

export default function PurchaseRequests() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ title: t('purchaseRequests') }]} />
      <PurchaseRequestsList />
    </div>
  );
}