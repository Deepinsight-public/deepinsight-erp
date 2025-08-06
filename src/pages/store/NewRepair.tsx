import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function NewRepair() {
  const breadcrumbs = [
    { title: 'Repairs', href: '/store/repairs' },
    { title: 'New Repair' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div>
        <h1 className="text-3xl font-bold mb-2">New Repair</h1>
        <p className="text-muted-foreground">
          Create a new repair request for products requiring service
        </p>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <p className="text-muted-foreground">
          New repair form coming soon. This will include product selection, 
          customer information, repair type, and description fields.
        </p>
      </div>
    </div>
  );
}