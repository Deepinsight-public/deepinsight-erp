import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { RepairDetail as RepairDetailComponent } from '@/modules/repairs/components/RepairDetail';

export default function RepairDetail() {
  const breadcrumbs = [
    { title: 'Repairs', href: '/store/repairs' },
    { title: 'Repair Details' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <RepairDetailComponent />
    </div>
  );
}