import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Printer, Package, Save, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs, LoadingOverlay, ConfirmDialog } from '@/components';
import { SalesOrderForm } from '@/modules/sales-inventory/components/SalesOrderForm';
import { InvoiceView } from '@/modules/sales-inventory/components/InvoiceView';
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const handleSave = async (updatedOrder: SalesOrderDTO) => {
    setOrder(updatedOrder);
    setEditMode(false);
    setHasUnsavedChanges(false);
    toast({
      title: 'Success',
      description: 'Order updated successfully'
    });
    // Don't navigate away, stay on the detail page to show updated data
  };

  const handleEditToggle = () => {
    if (editMode && hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      setEditMode(!editMode);
      setHasUnsavedChanges(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setHasUnsavedChanges(false);
    setShowCancelConfirm(false);
    // Reload the order to reset any unsaved changes
    loadOrder();
  };

  const isDraft = order?.status === 'draft';
  const isCompleted = order?.status === 'shipped' || order?.status === 'cancelled';
  // Allow editing for most statuses except shipped and cancelled - more permissive for testing
  const canEditOrder = order?.status && !['shipped', 'cancelled'].includes(order.status);
  const canEdit = editMode; // Only allow editing when explicitly in edit mode

  // Debug logging - can be removed after testing
  // console.log('Order status:', order?.status);
  // console.log('Can edit order:', canEditOrder);
  // console.log('Edit mode:', editMode);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
              <Badge className={getStatusColor(order.status || 'draft')}>
                {order.status || 'Draft'}
              </Badge>
              {editMode && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Edit Mode
                </Badge>
              )}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground">
                Sales order details and invoice
              </p>
              {/* Debug info - uncomment for debugging */}
              {/* <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Debug: Status={order?.status || 'undefined'} | CanEdit={canEditOrder ? 'Yes' : 'No'} | EditMode={editMode ? 'Yes' : 'No'}
              </div> */}
              {editMode && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    You are editing this order. Changes to confirmed orders may affect inventory and delivery schedules.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            
            {editMode ? (
              <Button variant="outline" onClick={handleEditToggle}>
                <X className="h-4 w-4 mr-2" />
                Cancel Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={handleEditToggle} disabled={!canEditOrder}>
                <Edit className="h-4 w-4 mr-2" />
                {canEditOrder ? 'Edit Order' : `Cannot Edit (${order?.status || 'Unknown'})`}
              </Button>
            )}
            
            {!isCompleted && order.status !== 'cancelled' && (
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Fulfill Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <SalesOrderForm
            initialData={order}
            onSave={handleSave}
            onCancel={() => {
              if (editMode) {
                handleEditToggle();
              } else {
                navigate('/store/sales-orders');
              }
            }}
            onFormChange={setHasUnsavedChanges}
            readOnly={!canEdit}
          />
        </TabsContent>
        
        <TabsContent value="invoice" className="mt-6">
          <InvoiceView order={order} />
        </TabsContent>
      </Tabs>

      {/* Confirmation dialog for canceling unsaved changes */}
      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        onConfirm={handleCancelEdit}
        destructive
      />
    </div>
  );
}