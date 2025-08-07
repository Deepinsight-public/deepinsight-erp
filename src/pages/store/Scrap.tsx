import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ScrapPage } from '@/modules/scrap/components/ScrapPage';

export default function Scrap() {
  const { t } = useTranslation();
  
  const breadcrumbs = [
    { title: t('inventory'), href: '/store/inventory' },
    { title: t('scrap') }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <ScrapPage />
    </div>
  );
}