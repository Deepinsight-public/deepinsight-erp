import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { fetchWarehouseAllocations, createPurchaseRequest } from '../api/purchase-requests';
import { WarehouseAllocation, PurchaseRequestItem } from '../types/purchase-requests';

interface AllocationWithProduct extends WarehouseAllocation {
  product?: {
    productName: string;
    brand: string;
    category: string;
    price: number;
  };
}

export function NewPurchaseRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<AllocationWithProduct[]>([]);
  const [selectedItems, setSelectedItems] = useState<PurchaseRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mock store/warehouse IDs - in real app these would come from auth context
  const currentStoreId = '22222222-2222-2222-2222-222222222222';
  const currentWarehouseId = '11111111-1111-1111-1111-111111111111';

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const data = await fetchWarehouseAllocations(currentWarehouseId);
      
      // Mock product data lookup (in real app this would be a proper join/lookup)
      const mockProducts = {
        'SKU001': { productName: 'iPhone 15 Pro Max', brand: 'Apple', category: 'Smartphones', price: 1199.99 },
        'SKU002': { productName: 'Samsung Galaxy S24', brand: 'Samsung', category: 'Smartphones', price: 999.99 },
        'SKU003': { productName: 'MacBook Air M2', brand: 'Apple', category: 'Laptops', price: 1299.99 }
      };

      const allocationsWithProducts = data.map(allocation => ({
        ...allocation,
        product: mockProducts[allocation.sku as keyof typeof mockProducts]
      }));

      setAllocations(allocationsWithProducts);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load available inventory',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedQuantity = (sku: string, qty: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.sku === sku);
      if (qty <= 0) {
        return prev.filter(item => item.sku !== sku);
      }
      if (existing) {
        return prev.map(item => item.sku === sku ? { ...item, qty } : item);
      }
      return [...prev, { sku, qty }];
    });
  };

  const getSelectedQty = (sku: string) => {
    const item = selectedItems.find(item => item.sku === sku);
    return item?.qty || 0;
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one item to purchase',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      // For demo, just use the first allocation ID
      const allocationId = allocations[0]?.id || '';
      
      await createPurchaseRequest(currentStoreId, {
        warehouseId: currentWarehouseId,
        allocationId,
        items: selectedItems
      });

      toast({
        title: 'Success',
        description: 'Purchase request created successfully',
      });

      navigate('/store/purchase-requests');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create purchase request',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'sku',
      title: 'SKU',
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'product',
      title: 'Product',
      render: (product: any) => (
        <div>
          <div className="font-medium">{product?.productName || 'Unknown Product'}</div>
          <div className="text-sm text-muted-foreground">
            {product?.brand} • {product?.category}
          </div>
        </div>
      ),
    },
    {
      key: 'qtyLeft',
      title: 'Available',
      render: (value: number) => (
        <Badge variant="secondary">{value} units</Badge>
      ),
    },
    {
      key: 'product',
      title: 'Price',
      render: (product: any) => (
        <span className="font-medium">
          ${product?.price?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      key: 'sku',
      title: 'Select Quantity',
      render: (sku: string, record: AllocationWithProduct) => {
        const selectedQty = getSelectedQty(sku);
        const maxQty = record.qtyLeft;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateSelectedQuantity(sku, Math.max(0, selectedQty - 1))}
              disabled={selectedQty <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Input
              type="number"
              value={selectedQty}
              onChange={(e) => {
                const qty = parseInt(e.target.value) || 0;
                updateSelectedQuantity(sku, Math.min(maxQty, Math.max(0, qty)));
              }}
              className="w-20 text-center"
              min="0"
              max={maxQty}
            />
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateSelectedQuantity(sku, Math.min(maxQty, selectedQty + 1))}
              disabled={selectedQty >= maxQty}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const totalItems = selectedItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Purchase Request (抢单)</h1>
          <p className="text-muted-foreground mt-2">
            Select products from available warehouse inventory
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/store/purchase-requests')}>
          Cancel
        </Button>
      </div>

      {/* Current Turn Alert */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">It's your turn to order!</p>
              <p className="text-sm text-green-600">
                Round #1 • 测试门店 • Please select your inventory now
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Products */}
      <Card>
        <CardHeader>
          <CardTitle>Available Inventory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select quantities from warehouse allocation
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={allocations}
            columns={columns}
            loading={loading}
            title="Available Products"
          />
        </CardContent>
      </Card>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Items ({totalItems} total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedItems.map(item => {
                const allocation = allocations.find(a => a.sku === item.sku);
                return (
                  <div key={item.sku} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.sku}</span>
                      <span className="text-muted-foreground ml-2">
                        {allocation?.product?.productName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{item.qty} units</span>
                      {allocation?.product?.price && (
                        <div className="text-sm text-muted-foreground">
                          ${(allocation.product.price * item.qty).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button 
          onClick={handleSubmit} 
          disabled={selectedItems.length === 0 || submitting}
          size="lg"
        >
          {submitting ? 'Creating...' : `Submit Purchase Request (${totalItems} items)`}
        </Button>
      </div>
    </div>
  );
}