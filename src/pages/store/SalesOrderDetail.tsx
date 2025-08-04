import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Printer, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs, LoadingOverlay } from '@/components';
import { SalesOrderForm } from '@/modules/sales-inventory/components/SalesOrderForm';
import { fetchSalesOrder } from '@/modules/sales-inventory/api/sales-orders';
import { SalesOrderDTO } from '@/modules/sales-inventory/types';
import { useToast } from '@/hooks/use-toast';

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<SalesOrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const orderData = await fetchSalesOrder(id);
      setOrder(orderData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive'
      });
      navigate('/store/sales-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedOrder: SalesOrderDTO) => {
    setOrder(updatedOrder);
    setEditMode(false);
    toast({
      title: 'Success',
      description: 'Order updated successfully'
    });
  };

  const isDraft = order?.status === 'draft';
  const canEdit = isDraft || editMode;

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { title: 'Sales Orders', href: '/store/sales-orders' },
          { title: 'Order Not Found' }
        ]} />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Order Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The requested order could not be found.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/store/sales-orders')}
          >
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[
          { title: 'Sales Orders', href: '/store/sales-orders' },
          { title: order.orderNumber || 'Order Details' }
        ]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-muted-foreground mt-2">
              Sales order details and line items
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {isDraft && !editMode && (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {!isDraft && order.status !== 'completed' && (
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Fulfill Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <SalesOrderForm
        initialData={order}
        onSave={handleSave}
        onCancel={() => {
          if (editMode) {
            setEditMode(false);
          } else {
            navigate('/store/sales-orders');
          }
        }}
        readOnly={!canEdit}
      />
    </div>
  );
}