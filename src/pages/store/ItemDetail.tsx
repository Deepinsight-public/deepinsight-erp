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
  QrCode,
  History,
  Info
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
import { InvoiceView } from '@/modules/sales-inventory/components/InvoiceView';
import type { SalesOrderDTO } from '@/modules/sales-inventory/types';

// Individual Item interface (not product)
interface IndividualItem {
  id: string;
  a4lCode: string;
  epc: string;
  gradeLabel: string | null;
  loadDate: string | null;
  currentStoreId: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string | null;
  productId: string;
  // Related product info
  product: {
    id: string;
    sku: string;
    product_name: string;
    brand: string | null;
    model: string | null;
    category: string | null;
    price: number;
    map_price: number;
    kw_code: string | null;
    description: string | null;
  } | null;
  // Related store info
  store: {
    id: string;
    name: string;
    store_code: string;
    type: string | null;
  } | null;
}

interface ItemHistoryEvent {
  id: string;
  type: 'loaded' | 'sold' | 'transferred_in' | 'transferred_out' | 'returned' | 'scrapped';
  date: string;
  description: string;
  fromLocation?: string;
  toLocation?: string;
  relatedId?: string;
  relatedNumber?: string;
  amount?: number;
  status: string;
  createdBy?: string;
  metadata?: any;
}

// Using the full SalesOrderDTO type for complete invoice functionality

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<IndividualItem | null>(null);
  const [history, setHistory] = useState<ItemHistoryEvent[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesOrderDTO | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [barcodeData, setBarcodeData] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadItemDetail();
    }
  }, [id]);

  const loadItemDetail = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading item detail for ID:', id);
      
      // Step 1: Load individual item data first
      const { data: itemData, error: itemError } = await supabase
        .from('Item')
        .select('*')
        .eq('id', id)
        .single();

      console.log('🔍 Item query result:', { itemData, itemError });

      if (itemError) {
        console.error('🔍 Item query error:', itemError);
        throw itemError;
      }

      if (!itemData) {
        console.error('🔍 No item data returned');
        throw new Error('Item not found');
      }

      // Step 2: Load related product data
      let productData = null;
      if (itemData.productId) {
        console.log('🔍 Loading product data for:', itemData.productId);
        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            id,
            sku,
            product_name,
            brand,
            model,
            category,
            price,
            map_price,
            kw_code,
            description
          `)
          .eq('id', itemData.productId)
          .single();

        if (productError) {
          console.error('🔍 Product query error:', productError);
        } else {
          productData = product;
          console.log('🔍 Product data loaded:', product);
        }
      }

      // Step 3: Load related store data  
      let storeData = null;
      if (itemData.currentStoreId) {
        console.log('🔍 Loading store data for:', itemData.currentStoreId);
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select(`
            id,
            store_name,
            store_code,
            region
          `)
          .eq('id', itemData.currentStoreId)
          .single();

        if (storeError) {
          console.error('🔍 Store query error:', storeError);
        } else if (store) {
          // Normalize to the shape used by the UI
          storeData = {
            id: store.id,
            name: (store as any).store_name,
            store_code: (store as any).store_code,
            type: (store as any).region,
          } as any;
          console.log('🔍 Store data loaded (normalized):', storeData);
        }
      }

      // Step 4: Combine all data
      setItem({
        ...itemData,
        product: productData,
        store: storeData
      });

      // Generate barcode data (using A4L code as primary identifier)
      setBarcodeData(itemData.a4lCode);

      console.log('🔍 Final item data set:', {
        item: itemData,
        product: productData,
        store: storeData
      });

      // Load item history
      await loadItemHistory(itemData.id, {
        ...itemData,
        product: productData,
        store: storeData
      });
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

  const loadItemHistory = async (itemId: string, itemData?: IndividualItem) => {
    try {
      console.log('🔍 Loading item history for:', itemId);
      
      // For now, let's build history from various sources
      const historyEvents: ItemHistoryEvent[] = [];

      // Use passed itemData or current state
      const currentItem = itemData || item;

      // 1. Load date (when item was created)
      if (currentItem?.loadDate || currentItem?.createdAt) {
        historyEvents.push({
          id: `load-${itemId}`,
          type: 'loaded',
          date: currentItem.loadDate || currentItem.createdAt,
          description: `Item loaded into ${currentItem.store?.name || 'store'}`,
          toLocation: currentItem.store?.name || 'Unknown Store',
          status: 'completed',
          createdBy: 'System'
        });
      }

      // 2. Check sales orders for this item (using product_id as fallback)
      const { data: salesData } = await supabase
        .from('sales_order_items')
        .select(`
          sales_orders(
            id,
            order_number,
            order_date,
            total_amount,
            status,
            customer_first,
            customer_last,
            customer_email
          )
        `)
        .eq('product_id', currentItem?.productId);

      if (salesData) {
        salesData.forEach((sale: any) => {
          const order = sale.sales_orders;
          if (order) {
            historyEvents.push({
              id: `sale-${order.id}`,
              type: 'sold',
              date: order.order_date,
              description: `Sold to ${order.customer_first} ${order.customer_last}`,
              relatedId: order.id,
              relatedNumber: order.order_number,
              amount: order.total_amount,
              status: order.status || 'completed',
              createdBy: 'Sales Team'
            });
          }
        });
      }

      // 3. Check after-sales returns
      const { data: returnsData } = await supabase
        .from('after_sales_returns')
        .select('*')
        .eq('product_id', currentItem?.productId);

      if (returnsData) {
        returnsData.forEach((returnItem: any) => {
          historyEvents.push({
            id: `return-${returnItem.id}`,
            type: 'returned',
            date: returnItem.return_date,
            description: `Returned: ${returnItem.reason}`,
            relatedId: returnItem.id,
            fromLocation: 'Customer',
            toLocation: 'Store',
            amount: returnItem.refund_amount,
            status: 'completed',
            createdBy: 'Customer Service'
          });
        });
      }

      // 4. Check scrap records (simplified for now)
      // Note: Will implement proper scrap tracking when scrap tables are confirmed
      // For now, we'll check if item status indicates it's scrapped
      if (currentItem?.status === 'scrapped') {
        historyEvents.push({
          id: `scrap-${itemId}`,
          type: 'scrapped',
          date: currentItem.updatedAt || currentItem.createdAt,
          description: 'Item marked as scrapped',
          status: 'completed',
          createdBy: 'System'
        });
      }

      // Sort by date (newest first)
      historyEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(historyEvents);

    } catch (error) {
      console.error('Error loading item history:', error);
      // Don't show error toast for history - it's supplementary
      setHistory([]);
    }
  };

  const loadSalesInvoice = async (orderId: string) => {
    try {
      console.log('📋 Loading sales invoice for order:', orderId);
      
      // Load complete order data with line items and product details
      const { data: orderData, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          sales_order_items(
            *,
            products(
              sku,
              product_name,
              kw_code
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error loading order data:', error);
        throw error;
      }

      if (orderData) {
        console.log('✅ Order data loaded:', orderData);

        // Transform order data to SalesOrderDTO format
        const salesOrderDTO: SalesOrderDTO = {
          id: orderData.id,
          orderNumber: orderData.order_number,
          customerName: `${orderData.customer_first || ''} ${orderData.customer_last || ''}`.trim(),
          customerEmail: orderData.customer_email,
          customerPhone: orderData.customer_phone,
          customerFirst: orderData.customer_first,
          customerLast: orderData.customer_last,
          addrCountry: orderData.addr_country,
          addrState: orderData.addr_state,
          addrCity: orderData.addr_city,
          addrStreet: orderData.addr_street,
          addrZipcode: orderData.addr_zipcode,
          orderDate: orderData.order_date || orderData.created_at,
          orderType: 'retail' as const,
          status: (orderData.status || 'pending') as any,
          subTotal: orderData.total_amount - (orderData.tax_amount || 0) - (orderData.other_fee || 0),
          discountAmount: orderData.discount_amount || 0,
          taxAmount: orderData.tax_amount || 0,
          totalAmount: orderData.total_amount,
          warrantyYears: orderData.warranty_years || 1,
          warrantyAmount: orderData.warranty_amount || 0,
          walkInDelivery: orderData.walk_in_delivery || 'walk-in',
          deliveryDate: (orderData as any).delivery_date,
          accessory: orderData.accessory,
          otherServices: orderData.other_services,
          otherFee: orderData.other_fee || 0,
          paymentMethod: orderData.payment_method1,
          paymentMethods: [
            orderData.payment_method1 && {
              method: orderData.payment_method1,
              amount: orderData.payment_amount1 || 0
            },
            orderData.payment_method2 && {
              method: orderData.payment_method2,
              amount: orderData.payment_amount2 || 0
            },
            orderData.payment_method3 && {
              method: orderData.payment_method3,
              amount: orderData.payment_amount3 || 0
            }
          ].filter(Boolean) as any,
          paymentNote: orderData.payment_note,
          customerSource: orderData.customer_source,
          cashierId: orderData.cashier_id,
          storeInvoiceNumber: orderData.store_invoice_number,
          createdAt: orderData.created_at,
          updatedAt: orderData.updated_at,
          createdBy: orderData.created_by,
          storeId: orderData.store_id,
          lines: (orderData.sales_order_items || []).map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            sku: item.products?.sku || '',
            productName: item.products?.product_name || '',
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 0,
            discountPercent: item.discount_amount > 0 ? 
              (item.discount_amount / (item.unit_price * item.quantity)) * 100 : 0,
            subTotal: item.total_amount || (item.unit_price * item.quantity),
            kwCodes: item.products?.kw_code ? [item.products.kw_code] : []
          }))
        };

        console.log('✅ Transformed SalesOrderDTO:', salesOrderDTO);
        setSelectedInvoice(salesOrderDTO);
        setShowInvoiceModal(true);
      }
    } catch (error) {
      console.error('💥 Error loading sales invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales invoice details',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'transferred':
        return 'bg-purple-100 text-purple-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      case 'scrapped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade: string | null) => {
    switch (grade) {
      case 'A+':
        return 'bg-green-100 text-green-800';
      case 'A':
        return 'bg-blue-100 text-blue-800';
      case 'B+':
        return 'bg-yellow-100 text-yellow-800';
      case 'B':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'loaded':
        return <Package className="w-4 h-4" />;
      case 'sold':
        return <ShoppingCart className="w-4 h-4" />;
      case 'transferred_in':
      case 'transferred_out':
        return <Truck className="w-4 h-4" />;
      case 'returned':
        return <RotateCcw className="w-4 h-4" />;
      case 'scrapped':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const generateBarcode = () => {
    // Simple barcode representation using the A4L code
    // In a real implementation, you'd use a barcode library like JsBarcode
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="text-xs text-gray-500">Item Barcode</div>
        <div className="flex items-center space-x-px bg-black p-2">
          {/* Simple barcode visualization */}
          {Array.from(barcodeData).map((char, index) => (
            <div
              key={index}
              className="bg-white"
              style={{
                width: char.charCodeAt(0) % 3 + 1 + 'px',
                height: '30px'
              }}
            />
          ))}
        </div>
        <div className="text-sm font-mono font-bold">{barcodeData}</div>
      </div>
    );
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Item Not Found</h2>
        <p className="text-gray-500 mb-4">The item you're looking for doesn't exist.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <Breadcrumbs
          items={[
            { title: 'Dashboard', href: '/store/dashboard' },
            { title: 'Order Search', href: '/store/orders/search' },
            { title: `Item ${item.a4lCode}` }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Details Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {item.product?.product_name || 'Unknown Product'}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.product?.brand} {item.product?.model}
                    </p>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Item Identifiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">A4L Code</p>
                      <p className="text-sm text-gray-600">{item.a4lCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <QrCode className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">EPC</p>
                      <p className="text-sm text-gray-600">{item.epc}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Info className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Grade</p>
                      <Badge className={getGradeColor(item.gradeLabel)}>
                        {item.gradeLabel || 'Standard'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">MAP Price</p>
                      <p className="text-sm text-gray-600">
                        ${(item.product?.map_price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Retail Price</p>
                      <p className="text-sm text-gray-600">
                        ${(item.product?.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Current Location</p>
                      <p className="text-sm text-gray-600">
                        {item.store?.name || 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Load Date</p>
                      <p className="text-sm text-gray-600">
                        {item.loadDate 
                          ? new Date(item.loadDate).toLocaleDateString()
                          : 'Not specified'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barcode Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Item Barcode
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generateBarcode()}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">KW Code</span>
                  <span className="text-sm font-medium">
                    {item.product?.kw_code || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SKU</span>
                  <span className="text-sm font-medium">
                    {item.product?.sku || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className="text-sm font-medium">
                    {item.product?.category || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days in Store</span>
                  <span className="text-sm font-medium">
                    {item.loadDate 
                      ? Math.floor((new Date().getTime() - new Date(item.loadDate).getTime()) / (1000 * 60 * 60 * 24))
                      : 'N/A'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History Tab */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <History className="w-5 h-5" />
                Item History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No history found for this item</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getHistoryIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {event.description}
                        </p>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>{new Date(event.date).toLocaleString()}</span>
                          {event.createdBy && <span> • by {event.createdBy}</span>}
                          {event.amount && (
                            <span> • ${event.amount.toLocaleString()}</span>
                          )}
                        </div>
                        {event.relatedNumber && (
                          <div className="mt-2">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => event.type === 'sold' && event.relatedId && loadSalesInvoice(event.relatedId)}
                              className="p-0 h-auto text-blue-600"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View {event.relatedNumber}
                            </Button>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sales Invoice Modal - Full Invoice View */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>Sales Invoice - {selectedInvoice?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="w-full">
              <InvoiceView order={selectedInvoice} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}