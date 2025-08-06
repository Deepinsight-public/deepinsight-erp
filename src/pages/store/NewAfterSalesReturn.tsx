import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { NewReturnForm } from '@/modules/after-sales/components/NewReturnForm';

export default function NewAfterSalesReturn() {
  const breadcrumbs = [
    { title: 'After-Sales', href: '/store/after-sales/returns' },
    { title: 'Returns', href: '/store/after-sales/returns' },
    { title: 'New Return' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div>
        <h1 className="text-3xl font-bold mb-2">New Return</h1>
        <p className="text-muted-foreground">
          Create a new return record for store or warehouse returns
        </p>
      </div>

      <NewReturnForm />
    </div>
  );
}