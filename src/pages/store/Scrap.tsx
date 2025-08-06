import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ScrapList } from '@/modules/inventory/components/ScrapList';

export default function Scrap() {
  const breadcrumbs = [
    { title: 'Inventory', href: '/store/inventory' },
    { title: 'Scrap Management' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <ScrapList />
    </div>
  );
}