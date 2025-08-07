import { Breadcrumbs } from '@/components';
import { PivotAnalysisPage } from '@/modules/sales/components/PivotAnalysisPage';

export default function SalesOrdersPivot() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { title: 'Sales Orders', href: '/store/sales-orders' },
        { title: 'Pivot Analysis' }
      ]} />
      
      <PivotAnalysisPage />
    </div>
  );
}