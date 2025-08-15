import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { TransferRecord } from '@/modules/inventory/components/TransferRecord';

export default function InventoryTransferRecord() {
  const { t } = useTranslation();
  const storeId = 'store-1'; // Would get from auth context

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs 
          items={[
            { title: t('inventory'), url: '/store/inventory' },
            { title: t('inventory.transfers.transferRecord.title') }
          ]} 
        />
      </div>
      
      <TransferRecord storeId={storeId} />
    </div>
  );
}
