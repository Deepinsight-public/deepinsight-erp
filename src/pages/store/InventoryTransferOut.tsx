import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { TransferOut } from '@/modules/inventory/components/TransferOut';

export default function InventoryTransferOut() {
  const { t } = useTranslation();
  const storeId = 'store-1'; // Would get from auth context

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs 
          items={[
            { title: t('inventory'), href: '/store/inventory' },
            { title: t('inventory.transfers.transferOut.title') }
          ]} 
        />
      </div>
      
      <TransferOut storeId={storeId} />
    </div>
  );
}
