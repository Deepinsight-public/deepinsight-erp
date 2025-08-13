import { Breadcrumbs } from '@/components';
import { SimplePivotTable } from '@/modules/sales-inventory/components/SimplePivotTable';

export default function SalesOrdersPivot() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { title: 'Sales Orders', href: '/store/sales-orders' },
        { title: 'Pivot Analysis' }
      ]} />
      
      <SimplePivotTable />
    </div>
  );
}