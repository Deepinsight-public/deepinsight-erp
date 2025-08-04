import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit, Printer, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs, StatusBadge } from '@/components';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const { t } = useTranslation();

  // Mock order data - in real app, this would be fetched based on ID
  const order = {
    id,
    orderNumber: 'SO-2024-001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    status: 'pending',
    totalAmount: 1250.00,
    createdAt: '2024-01-15T10:30:00Z',
    items: [
      {
        id: '1',
        productName: 'Wireless Bluetooth Headphones',
        sku: 'WBH-001',
        quantity: 2,
        unitPrice: 99.99,
        totalPrice: 199.98,
      },
      {
        id: '2',
        productName: 'USB-C Cable',
        sku: 'USC-002',
        quantity: 5,
        unitPrice: 15.99,
        totalPrice: 79.95,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[
          { title: t('salesOrders'), href: '/store/sales-orders' },
          { title: order.orderNumber }
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
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Fulfill Order
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={order.status as any} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                  <p className="text-lg font-bold">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Qty: {item.quantity}</p>
                      <p className="text-sm text-muted-foreground">${item.unitPrice} each</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>$0.00</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                Update Status
              </Button>
              <Button className="w-full" variant="outline">
                Add Note
              </Button>
              <Button className="w-full" variant="outline">
                Send Email
              </Button>
              <Button className="w-full" variant="destructive">
                Cancel Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}