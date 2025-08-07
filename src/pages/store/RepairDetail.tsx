import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function RepairDetail() {
  const breadcrumbs = [
    { title: 'Repairs', href: '/store/repairs' },
    { title: 'Repair Details' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div>
        <h1 className="text-3xl font-bold mb-2">Repair Details</h1>
        <p className="text-muted-foreground">
          View and manage individual repair progress and details
        </p>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <p className="text-muted-foreground">
          Repair detail view coming soon. This will include repair status, 
          parts used, labor time, customer communications, and progress updates.
        </p>
      </div>
    </div>
  );
}