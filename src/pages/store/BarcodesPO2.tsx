import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Package, Calendar, Hash, Eye, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs, LoadingOverlay } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PO2Purchase {
  id: string;
  purchaseOrderNumber: string;
  warehouseName: string;
  orderDate: string;
  status: string;
  totalItems: number;
  totalQuantity: number;
  products: PO2Product[];
}

interface PO2Product {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export default function BarcodesPO2() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PO2Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<PO2Purchase | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      // For now, let's create some mock data since the actual PO2 structure might not exist
      // In a real implementation, this would fetch from the database
      const mockPurchases: PO2Purchase[] = [
        {
          id: '1',
          purchaseOrderNumber: 'PO2-2024-001',
          warehouseName: 'Main Warehouse',
          orderDate: '2024-01-15',
          status: 'Completed',
          totalItems: 3,
          totalQuantity: 25,
          products: [
            {
              id: '1',
              sku: 'IPHONE15',
              productName: 'iPhone 15 Pro 256GB',
              quantity: 5,
              unitPrice: 1199.99,
              totalAmount: 5999.95
            },
            {
              id: '2', 
              sku: 'MACBOOK',
              productName: 'MacBook Air M2',
              quantity: 3,
              unitPrice: 1399.99,
              totalAmount: 4199.97
            },
            {
              id: '3',
              sku: 'IPADAIR',
              productName: 'iPad Air 5th Gen WiFi', 
              quantity: 10,
              unitPrice: 599.99,
              totalAmount: 5999.90
            }
          ]
        },
        {
          id: '2',
          purchaseOrderNumber: 'PO2-2024-002',
          warehouseName: 'Electronics Warehouse',
          orderDate: '2024-01-20',
          status: 'In Transit',
          totalItems: 2,
          totalQuantity: 15,
          products: [
            {
              id: '4',
              sku: 'SAMSUNG55',
              productName: 'Samsung 55" QLED TV',
              quantity: 8,
              unitPrice: 899.99,
              totalAmount: 7199.92
            },
            {
              id: '5',
              sku: 'SONY65', 
              productName: 'Sony 65" OLED TV',
              quantity: 7,
              unitPrice: 1799.99,
              totalAmount: 12599.93
            }
          ]
        },
        {
          id: '3',
          purchaseOrderNumber: 'PO2-2024-003',
          warehouseName: 'Main Warehouse',
          orderDate: '2024-01-25',
          status: 'Processing',
          totalItems: 4,
          totalQuantity: 50,
          products: [
            {
              id: '6',
              sku: 'MECH_KB',
              productName: 'Mechanical Gaming Keyboard',
              quantity: 20,
              unitPrice: 149.99,
              totalAmount: 2999.80
            },
            {
              id: '7',
              sku: 'GAMING_MOUSE',
              productName: 'Gaming Mouse RGB',
              quantity: 15,
              unitPrice: 79.99,
              totalAmount: 1199.85
            },
            {
              id: '8',
              sku: 'ULTRAWIDE',
              productName: '34" Ultrawide Monitor',
              quantity: 10,
              unitPrice: 499.99,
              totalAmount: 4999.90
            },
            {
              id: '9',
              sku: 'WEBCAM',
              productName: 'HD Webcam 1080p',
              quantity: 5,
              unitPrice: 49.99,
              totalAmount: 249.95
            }
          ]
        }
      ];

      setPurchases(mockPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBarcode = (purchase: PO2Purchase) => {
    setSelectedPurchase(purchase);
    setShowBarcodeModal(true);
  };

  const handlePrintBarcode = () => {
    if (selectedPurchase) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const barcodeData = generateBarcodeData(selectedPurchase);
        const barcodePattern = generateBarcodePattern(barcodeData);
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Barcode - ${selectedPurchase.purchaseOrderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
                .barcode-container { margin: 20px 0; }
                .barcode { display: inline-flex; align-items: end; justify-content: center; margin: 10px 0; }
                .bar { height: 64px; }
                .barcode-text { font-family: monospace; font-size: 12px; margin: 5px 0; }
                .title { font-size: 14px; margin: 5px 0; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <h2>${selectedPurchase.purchaseOrderNumber}</h2>
              <p>${selectedPurchase.warehouseName}</p>
              <div class="barcode-container">
                <div class="barcode">
                  ${barcodePattern.map(bar => 
                    `<div class="bar" style="width: ${bar.width * 2}px; background-color: ${bar.black ? 'black' : 'white'};"></div>`
                  ).join('')}
                </div>
                <div class="barcode-text">${barcodeData}</div>
                <div class="title">${selectedPurchase.purchaseOrderNumber}</div>
              </div>
              <p>Total Items: ${selectedPurchase.totalItems} | Total Quantity: ${selectedPurchase.totalQuantity}</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in transit':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const generateBarcodeData = (purchase: PO2Purchase) => {
    // Generate a barcode string that includes purchase order info
    return `PO2-${purchase.id}-${purchase.purchaseOrderNumber}-${purchase.totalItems}`;
  };

  const generateBarcodePattern = (data: string) => {
    // Simple algorithm to generate a barcode pattern based on the data
    // This creates a more realistic barcode appearance
    const pattern = [];
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      // Create varying widths based on character codes
      const wide = charCode % 3 === 0;
      const medium = charCode % 2 === 0;
      
      pattern.push({ width: wide ? 4 : medium ? 2 : 1, black: true });
      pattern.push({ width: 1, black: false }); // separator
    }
    
    // Add some start/end patterns
    return [
      { width: 2, black: true },
      { width: 1, black: false },
      { width: 1, black: true },
      { width: 2, black: false },
      ...pattern,
      { width: 2, black: false },
      { width: 1, black: true },
      { width: 1, black: false },
      { width: 2, black: true }
    ];
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Barcodes (PO2)</h1>
          <p className="text-muted-foreground">
            Generate and view barcodes for warehouse purchase orders
          </p>
        </div>
        <Breadcrumbs items={[{ title: 'Barcodes (PO2)' }]} />
      </div>

      <div className="grid gap-4">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {purchase.purchaseOrderNumber}
                </CardTitle>
                <Badge className={getStatusColor(purchase.status)}>
                  {purchase.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Warehouse</p>
                    <p className="font-medium">{purchase.warehouseName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{new Date(purchase.orderDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="font-medium">{purchase.totalItems}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                    <p className="font-medium">{purchase.totalQuantity}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-muted-foreground">Products:</p>
                <div className="flex flex-wrap gap-2">
                  {purchase.products.map((product) => (
                    <Badge key={product.id} variant="outline" className="text-xs">
                      {product.sku} × {product.quantity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleViewBarcode(purchase)}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  View Barcode
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barcode Display Modal */}
      <Dialog open={showBarcodeModal} onOpenChange={setShowBarcodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Purchase Order Barcode
            </DialogTitle>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">{selectedPurchase.purchaseOrderNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPurchase.warehouseName}
                </p>
              </div>

              {/* Barcode Display Area */}
              <div className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="space-y-4">
                  {/* Simple text-based barcode representation */}
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded">
                    {generateBarcodeData(selectedPurchase)}
                  </div>
                  
                  {/* Visual barcode representation */}
                  <div className="flex justify-center">
                    <div className="space-y-2">
                      <div className="flex items-end justify-center">
                        {generateBarcodePattern(generateBarcodeData(selectedPurchase)).map((bar, i) => (
                          <div
                            key={i}
                            className={`h-16 ${bar.black ? 'bg-black' : 'bg-white'}`}
                            style={{ width: `${bar.width * 2}px` }}
                          />
                        ))}
                      </div>
                      <div className="text-xs font-mono text-center px-4">
                        {generateBarcodeData(selectedPurchase)}
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        {selectedPurchase.purchaseOrderNumber}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Items:</p>
                  <p className="font-medium">{selectedPurchase.totalItems}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Quantity:</p>
                  <p className="font-medium">{selectedPurchase.totalQuantity}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Products in this order:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedPurchase.products.map((product) => (
                    <div key={product.id} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                      <span>{product.sku} - {product.productName}</span>
                      <span>×{product.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handlePrintBarcode}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Printer className="h-4 w-4" />
                  Print Barcode
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
