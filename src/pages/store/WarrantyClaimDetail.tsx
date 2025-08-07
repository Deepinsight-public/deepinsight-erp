import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { WarrantyClaimDetail } from '@/modules/after-sales/components/WarrantyClaimDetail';

export default function WarrantyClaimDetailPage() {
  const breadcrumbs = [
    { title: 'After-Sales', href: '/store/after-sales/returns' },
    { title: 'Warranty Claims', href: '/store/after-sales/returns' },
    { title: 'Claim Details' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <WarrantyClaimDetail />
    </div>
  );
}