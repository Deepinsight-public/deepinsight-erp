import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Eye,
  Truck,
  ShoppingCart,
  RotateCcw,
  FileText,
  Activity,
  Badge as BadgeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumbs, LoadingOverlay } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ItemDetail {
  id: string;
  sku: string;
  kwCode?: string;
  productName: string;
  brand?: string;
  model: string;
  category?: string;
  price: number;
  mapPrice: number;
  isNew?: boolean;
  productType?: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
}

interface ItemHistory {
  id: string;
  type: 'load' | 'sale' | 'transfer_in' | 'transfer_out' | 'return' | 'scrap';
  date: string;
  description: string;
  fromLocation?: string;
  toLocation?: string;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  status: string;
  createdBy?: string;
  details?: any;
}

interface SalesInvoice {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [history, setHistory] = useState<ItemHistory[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadItemDetail();
    }
  }, [id]);

  const loadItemDetail = async () => {
    setLoading(true);
    try {
      // Load product details with inventory
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          id,
          sku,
          kw_code,
          product_name,
          brand,
          model,
          price,
          map_price,
          inventory (
            quantity,
            reserved_quantity
          )
        `)
        .eq('id', id)
        .single();

      if (productError) throw productError;

      if (productData) {
        const inventory = productData.inventory?.[0];
        const currentStock = inventory?.quantity || 0;
        const reservedStock = inventory?.reserved_quantity || 0;
        const availableStock = Math.max(0, currentStock - reservedStock);

        setItem({
          id: productData.id,
          sku: productData.sku,
          kwCode: productData.kw_code,
          productName: productData.product_name,
          brand: productData.brand,
          model: productData.model,
          category: 'Electronics', // Default category since it's not in the current schema
          price: productData.price || 0,
          mapPrice: productData.map_price || 0,
          isNew: false, // Default to false since column doesn't exist yet
          productType: 'OTHER', // Default since not in current schema
          description: '', // Default since not in current schema
          currentStock,
          reservedStock,
          availableStock
        });

        // Load item history
        await loadItemHistory(productData.id);
      }
    } catch (error) {
      console.error('Error loading item details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load item details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadItemHistory = async (itemId: string) => {
    try {
      // This would be replaced with actual item event tracking
      // For now, let's create some mock history data
      const mockHistory: ItemHistory[] = [
        {
          id: '1',
          type: 'load',
          date: '2024-01-15T10:00:00Z',
          description: 'Item loaded into store from warehouse',
          toLocation: 'Main Store',
          status: 'completed',
          createdBy: 'System'
        },
        {
          id: '2', 
          type: 'sale',
          date: '2024-01-20T14:30:00Z',
          description: 'Sold to customer via sales order',
          orderId: 'SO-2024-001',
          orderNumber: 'SO-2024-001',
          amount: 1199.99,
          status: 'completed',
          createdBy: 'John Doe'
        },
        {
          id: '3',
          type: 'return',
          date: '2024-01-25T09:15:00Z', 
          description: 'Returned by customer - defective',
          orderId: 'RET-2024-001',
          orderNumber: 'RET-2024-001',
          fromLocation: 'Customer',
          toLocation: 'Main Store',
          status: 'completed',
          createdBy: 'Jane Smith'
        }
      ];

      setHistory(mockHistory);
    } catch (error) {
      console.error('Error loading item history:', error);
    }
  };

  const handleViewInvoice = async (historyItem: ItemHistory) => {
    if (historyItem.type === 'sale' && historyItem.orderId) {
      try {
        // Mock invoice data - in real implementation, this would fetch from sales_orders
        const mockInvoice: SalesInvoice = {
          id: historyItem.orderId,
          orderNumber: historyItem.orderNumber || '',
          customerName: 'John Doe',
          customerEmail: 'john.doe@email.com',
          orderDate: historyItem.date,
          totalAmount: historyItem.amount || 0,
          status: 'paid',
          items: [
            {
                          sku: item?.sku || '',
            productName: `${item?.brand} ${item?.model}`,
              quantity: 1,
              unitPrice: historyItem.amount || 0,
              totalAmount: historyItem.amount || 0
            }
          ]
        };

        setSelectedInvoice(mockInvoice);
        setShowInvoiceModal(true);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load invoice details',
          variant: 'destructive'
        });
      }
    }
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'load': return <Package className="h-4 w-4" />;
      case 'sale': return <ShoppingCart className="h-4 w-4" />;
      case 'transfer_in':
      case 'transfer_out': return <Truck className="h-4 w-4" />;
      case 'return': return <RotateCcw className="h-4 w-4" />;
      case 'scrap': return <BadgeIcon className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getHistoryColor = (type: string) => {
    switch (type) {
      case 'load': return 'bg-blue-100 text-blue-800';
      case 'sale': return 'bg-green-100 text-green-800';
      case 'transfer_in': return 'bg-purple-100 text-purple-800';
      case 'transfer_out': return 'bg-orange-100 text-orange-800';
      case 'return': return 'bg-red-100 text-red-800';
      case 'scrap': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_stock':
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-yellow-100 text-yellow-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!item) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Item Not Found</h1>
        <Button onClick={() => navigate('/store/orders/search')}>
          Back to Search
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/store/orders/search')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{item.sku}</h1>
            <p className="text-muted-foreground">
              {item.brand} {item.model}
            </p>
          </div>
        </div>
        <Breadcrumbs items={[
          { title: 'Order Search', href: '/store/orders/search' },
          { title: item.sku }
        ]} />
      </div>

      {/* Item Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={item.availableStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {item.availableStock > 0 ? 'In Stock' : 'Out of Stock'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {item.availableStock} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">Total: {item.currentStock}</p>
            <p className="text-sm text-muted-foreground">Reserved: {item.reservedStock}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              MAP Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">${item.mapPrice.toFixed(2)}</p>
            {item.isNew && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">NEW</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Regular Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">${item.price.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="font-medium">{item.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">KW Code</label>
                  <p className="font-medium">{item.kwCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="font-medium">{item.category || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                  <p className="font-medium">{item.productType || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand</label>
                  <p className="font-medium">{item.brand || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Model</label>
                  <p className="font-medium">{item.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                  <p className="font-medium">{item.productName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Is New Product</label>
                  <p className="font-medium">{item.isNew ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {item.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="font-medium">{item.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Item History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((historyItem) => (
                  <div key={historyItem.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${getHistoryColor(historyItem.type)}`}>
                      {getHistoryIcon(historyItem.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{historyItem.type.replace('_', ' ')}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(historyItem.date).toLocaleString()}
                          </span>
                          {historyItem.type === 'sale' && historyItem.orderId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewInvoice(historyItem)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{historyItem.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {historyItem.fromLocation && (
                          <span>From: {historyItem.fromLocation}</span>
                        )}
                        {historyItem.toLocation && (
                          <span>To: {historyItem.toLocation}</span>
                        )}
                        {historyItem.amount && (
                          <span>Amount: ${historyItem.amount.toFixed(2)}</span>
                        )}
                        {historyItem.orderNumber && (
                          <span>Order: {historyItem.orderNumber}</span>
                        )}
                        {historyItem.createdBy && (
                          <span>By: {historyItem.createdBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No history records found for this item</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sales Invoice - {selectedInvoice?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-medium">{selectedInvoice.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.customerEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                  <p className="font-medium">{new Date(selectedInvoice.orderDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Items</h3>
                <div className="border rounded-lg">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-medium text-sm">
                    <div>Product</div>
                    <div>Quantity</div>
                    <div>Unit Price</div>
                    <div>Total</div>
                  </div>
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 border-t">
                      <div>
                        <p className="font-medium">{item.sku}</p>
                        <p className="text-sm text-muted-foreground">{item.productName}</p>
                      </div>
                      <div>{item.quantity}</div>
                      <div>${item.unitPrice.toFixed(2)}</div>
                      <div>${item.totalAmount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Badge className={selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {selectedInvoice.status.toUpperCase()}
                </Badge>
                <div className="text-right">
                  <p className="text-lg font-bold">Total: ${selectedInvoice.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
