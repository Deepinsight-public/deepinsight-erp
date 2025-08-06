import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ReturnDetail } from '@/modules/after-sales/components/ReturnDetail';

export default function AfterSalesReturnDetail() {
  const breadcrumbs = [
    { title: 'After-Sales', href: '/store/after-sales/returns' },
    { title: 'Returns', href: '/store/after-sales/returns' },
    { title: 'Return Details' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <ReturnDetail />
    </div>
  );
}