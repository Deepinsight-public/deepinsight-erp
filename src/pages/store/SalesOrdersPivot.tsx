import { Breadcrumbs } from '@/components';
import { PivotTool } from '@/modules/sales-inventory/components/PivotTool';
import { fetchSalesOrders } from '@/modules/sales-inventory/api/sales-orders';

export default function SalesOrdersPivot() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { title: 'Sales Orders', href: '/store/sales-orders' },
        { title: 'Custom Pivot' }
      ]} />
      
      <PivotTool
        sourceQuery={fetchSalesOrders}
        defaultGroupBy={['orderDate']}
        groupableFields={[
          { key: 'orderDate', label: 'Date' },
          { key: 'customerName', label: 'Customer' },
          { key: 'status', label: 'Status' },
          { key: 'orderType', label: 'Order Type' }
        ]}
        summariseFields={[
          { key: 'totalAmount', label: 'Grand Total', fn: 'sum' },
          { key: 'subTotal', label: 'Sub Total', fn: 'sum' },
          { key: 'taxAmount', label: 'Tax', fn: 'sum' },
          { key: 'discountAmount', label: 'Discount', fn: 'sum' }
        ]}
      />
    </div>
  );
}