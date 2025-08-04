import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components';
import { SalesOrderForm } from '@/modules/sales-inventory/components/SalesOrderForm';
import { SalesOrderDTO } from '@/modules/sales-inventory/types';

export default function NewSalesOrder() {
  const navigate = useNavigate();

  const handleSave = (order: SalesOrderDTO) => {
    navigate(`/store/sales-orders/${order.id}`);
  };

  const handleCancel = () => {
    navigate('/store/sales-orders');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { title: 'Sales Orders', href: '/store/sales-orders' },
        { title: 'New Order' }
      ]} />
      
      <div>
        <h1 className="text-3xl font-bold">Create New Sales Order</h1>
        <p className="text-muted-foreground mt-2">
          Create a new sales order for your customer.
        </p>
      </div>

      <SalesOrderForm
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}