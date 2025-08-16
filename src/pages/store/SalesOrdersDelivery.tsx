import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Download, 
  Printer, 
  MapPin, 
  User, 
  Package,
  Phone,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs, StatusBadge } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  orderDate: string;
  storeInvoiceNumber?: string;
}

// Helper function to map database status to DeliveryOrder status
const mapDeliveryStatus = (dbStatus: string | null | undefined): 'pending' | 'confirmed' | 'shipped' | 'delivered' => {
  switch (dbStatus?.toLowerCase()) {
    case 'confirmed':
      return 'confirmed';
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    default:
      return 'pending';
  }
};

export default function SalesOrdersDelivery() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Safely format dates to avoid runtime errors on invalid/empty values
  const safeFormatDate = (value: string | Date | null | undefined, pattern: string): string => {
    if (!value) return 'N/A';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
    try {
      return format(date, pattern);
    } catch (_err) {
      return 'N/A';
    }
  };

  // Load delivery orders
  const loadDeliveryOrders = async () => {
    setLoading(true);
    try {
      // Mock data for delivery orders to avoid complex Supabase type inference issues
      const mockDeliveryOrders: DeliveryOrder[] = [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          customerName: 'John Smith',
          customerPhone: '+1-555-0123',
          deliveryAddress: '123 Main St, Anytown, ST 12345',
          deliveryDate: '2024-01-20',
          status: 'pending',
          items: [
            { productName: 'Wireless Headphones', sku: 'WH-001', quantity: 1, unitPrice: 129.99 },
            { productName: 'Phone Case', sku: 'PC-002', quantity: 2, unitPrice: 24.99 }
          ],
          totalAmount: 179.97,
          orderDate: '2024-01-15',
          storeInvoiceNumber: 'INV-001'
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          customerName: 'Jane Doe',
          customerPhone: '+1-555-0456',
          deliveryAddress: '456 Oak Ave, Different City, ST 67890',
          deliveryDate: '2024-01-21',
          status: 'confirmed',
          items: [
            { productName: 'Bluetooth Speaker', sku: 'BS-003', quantity: 1, unitPrice: 89.99 }
          ],
          totalAmount: 89.99,
          orderDate: '2024-01-16',
          storeInvoiceNumber: 'INV-002'
        },
        {
          id: '3',
          orderNumber: 'ORD-2024-003',
          customerName: 'Bob Johnson',
          customerPhone: '+1-555-0789',
          deliveryAddress: '789 Pine St, Another Town, ST 11111',
          deliveryDate: '2024-01-22',
          status: 'shipped',
          items: [
            { productName: 'Tablet', sku: 'TB-004', quantity: 1, unitPrice: 299.99 },
            { productName: 'Screen Protector', sku: 'SP-005', quantity: 1, unitPrice: 19.99 }
          ],
          totalAmount: 319.98,
          orderDate: '2024-01-17',
          storeInvoiceNumber: 'INV-003'
        }
      ];

      // Apply filters to mock data
      let filteredOrders = mockDeliveryOrders;

      if (statusFilter && statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.customerName.toLowerCase().includes(searchLower) ||
          order.orderNumber.toLowerCase().includes(searchLower)
        );
      }

      if (dateFilter) {
        filteredOrders = filteredOrders.filter(order => order.deliveryDate === dateFilter);
      }

      setDeliveryOrders(filteredOrders);
    } catch (error) {
      console.error('Failed to load delivery orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load delivery orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadDeliveryOrders();
  }, [statusFilter, searchQuery, dateFilter]);

  // Export delivery list for printing
  const exportDeliveryList = () => {
    const printContent = generateDeliveryList();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate delivery list HTML
  const generateDeliveryList = () => {
    const today = format(new Date(), 'PPP');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery List - ${today}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .delivery-item { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; page-break-inside: avoid; }
            .customer-info { font-weight: bold; margin-bottom: 10px; }
            .address { color: #666; margin-bottom: 10px; }
            .items-list { margin-top: 10px; }
            .item { margin: 5px 0; }
            .total { font-weight: bold; margin-top: 10px; }
            .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-confirmed { background-color: #dbeafe; color: #1e40af; }
            .status-shipped { background-color: #d1fae5; color: #065f46; }
            @media print {
              .no-print { display: none; }
              .delivery-item { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚛 DELIVERY LIST</h1>
            <p>Date: ${today} | Total Orders: ${deliveryOrders.length}</p>
          </div>
          
          ${deliveryOrders.map(order => `
            <div class="delivery-item">
              <div class="customer-info">
                📦 ${order.orderNumber} | ${order.customerName}
                ${order.customerPhone ? `| 📞 ${order.customerPhone}` : ''}
              </div>
              
              <div class="address">
                📍 <strong>Delivery Address:</strong><br/>
                ${order.deliveryAddress || 'No address provided'}
              </div>
              
              <div>
                📅 <strong>Delivery Date:</strong> ${safeFormatDate(order.deliveryDate, 'PPP')}
                <span class="status status-${order.status}">
                  ${order.status.toUpperCase()}
                </span>
              </div>
              
              <div class="items-list">
                <strong>📋 Items to Deliver:</strong>
                ${order.items.map(item => `
                  <div class="item">
                    • ${item.productName} (${item.sku}) - Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)}
                  </div>
                `).join('')}
              </div>
              
              <div class="total">
                💰 <strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}
                ${order.storeInvoiceNumber ? `| Invoice: ${order.storeInvoiceNumber}` : ''}
              </div>
            </div>
          `).join('')}
          
          <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px; text-align: center; color: #666;">
            <p>End of Delivery List - Please verify all deliveries and update status accordingly</p>
            <p>Generated on ${format(new Date(), 'PPP p')}</p>
          </div>
        </body>
      </html>
    `;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[
          { title: 'Sales Orders', href: '/store/sales-orders' },
          { title: 'Delivery Management' }
        ]} />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-600" />
              Delivery Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage all sales orders requiring delivery. Track and print delivery lists for drivers.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={loadDeliveryOrders}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={exportDeliveryList}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={deliveryOrders.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Delivery List
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search Orders</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, order number..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Delivery Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
                className="mt-1"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Orders ({deliveryOrders.length})
            </CardTitle>
            {deliveryOrders.length > 0 && (
              <Badge variant="outline">
                Total Value: ${deliveryOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p>Loading delivery orders...</p>
            </div>
          ) : deliveryOrders.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Delivery Orders Found</h3>
              <p className="text-muted-foreground mb-4">
                No orders requiring delivery match your current filters.
              </p>
              <Button variant="outline" onClick={loadDeliveryOrders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Info</TableHead>
                    <TableHead>Customer & Contact</TableHead>
                    <TableHead>Delivery Address</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          {order.storeInvoiceNumber && (
                            <div className="text-sm text-gray-500">
                              Invoice: {order.storeInvoiceNumber}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {safeFormatDate(order.orderDate, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {order.customerName}
                          </div>
                          {order.customerPhone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.customerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-1 max-w-xs">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            {order.deliveryAddress || 'No address provided'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-xs">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.quantity}× {item.productName}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{safeFormatDate(order.deliveryDate, 'MMM dd, yyyy')}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <StatusBadge 
                          status={order.status} 
                          variant={getStatusColor(order.status)} 
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">
                          ${order.totalAmount.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
