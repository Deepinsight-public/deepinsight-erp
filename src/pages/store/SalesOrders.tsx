import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Breadcrumbs } from '@/components';
import { SalesOrdersSummary } from '@/modules/sales-inventory/components/SalesOrdersSummary';

export default function SalesOrders() {
  const { t } = useTranslation();

  // Route-scoped: disable page-level horizontal scroll while mounted
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflowX;
    const prevBody = body.style.overflowX;
    html.style.overflowX = 'hidden';
    body.style.overflowX = 'hidden';
    return () => {
      html.style.overflowX = prevHtml;
      body.style.overflowX = prevBody;
    };
  }, []);
  
  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <Breadcrumbs items={[{ title: t('salesOrders') }]} />
        <SalesOrdersSummary />
      </div>
    </main>
  );
}