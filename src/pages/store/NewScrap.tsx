import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ScrapForm } from '@/modules/scrap/components/ScrapForm';

export default function NewScrap() {
  const breadcrumbs = [
    { title: 'Inventory', href: '/store/inventory' },
    { title: 'Scrap Management', href: '/store/scrap' },
    { title: 'New Scrap Request' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div>
        <h1 className="text-3xl font-bold mb-2">New Scrap Request</h1>
        <p className="text-muted-foreground">
          Create a new inventory scrap request for approval
        </p>
      </div>

      <ScrapForm />
    </div>
  );
}