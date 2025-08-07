import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ScrapList } from '@/modules/inventory/components/ScrapList';

export default function Scrap() {
  const { t } = useTranslation();
  
  const breadcrumbs = [
    { title: t('inventory'), href: '/store/inventory' },
    { title: t('scrap') }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <ScrapList />
    </div>
  );
}