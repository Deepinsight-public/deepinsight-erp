import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { TransferIn } from '@/modules/inventory/components/TransferIn';

export default function InventoryTransferIn() {
  const { t } = useTranslation();
  const storeId = 'store-1'; // Would get from auth context

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs 
          items={[
            { title: t('inventory'), href: '/store/inventory' },
            { title: t('inventory.transfers.transferIn.title') }
          ]} 
        />
      </div>
      
      <TransferIn storeId={storeId} />
    </div>
  );
}
