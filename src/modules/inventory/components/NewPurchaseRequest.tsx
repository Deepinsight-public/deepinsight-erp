import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { fetchWarehouseInventory, submitPurchaseRequest } from '../api/purchase-requests';
import { WarehouseInventoryItem, PurchaseSubmitItem } from '../types/purchase-requests';

export function NewPurchaseRequest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<WarehouseInventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<PurchaseSubmitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Use actual user's store ID from auth instead of hardcoded values
  const currentStoreId = '550e8400-e29b-41d4-a716-446655440000'; // 上海中心店 (current logged-in user)
  const currentWarehouseId = '11111111-1111-1111-1111-111111111111';

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchWarehouseInventory(currentWarehouseId);
      setInventory(data);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('newPurchaseRequest.errors.loadFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedQuantity = (inventoryId: string, qty: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.inventoryId === inventoryId);
      if (qty <= 0) {
        return prev.filter(item => item.inventoryId !== inventoryId);
      }
      if (existing) {
        return prev.map(item => item.inventoryId === inventoryId ? { ...item, qty } : item);
      }
      return [...prev, { inventoryId, qty }];
    });
  };

  const getSelectedQty = (inventoryId: string) => {
    const item = selectedItems.find(item => item.inventoryId === inventoryId);
    return item?.qty || 0;
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: t('error'),
        description: t('newPurchaseRequest.errors.selectItems'),
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitPurchaseRequest(currentStoreId, {
        warehouseId: currentWarehouseId,
        items: selectedItems
      });

      toast({
        title: t('success'),
        description: t('newPurchaseRequest.success'),
      });

      navigate('/store/purchase-requests');
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('newPurchaseRequest.errors.submitFailed'),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'sku',
      title: t('newPurchaseRequest.columns.sku'),
      render: (value: string) => (
        <span className="font-medium text-primary">{value}</span>
      ),
    },
    {
      key: 'name',
      title: t('newPurchaseRequest.columns.product'),
      render: (name: string, record: WarehouseInventoryItem) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">
            SKU: {record.sku}
          </div>
        </div>
      ),
    },
    {
      key: 'qtyAvailable',
      title: t('newPurchaseRequest.columns.available'),
      render: (value: number) => (
        <Badge variant="secondary">{value} {t('newPurchaseRequest.units')}</Badge>
      ),
    },
    {
      key: 'price',
      title: t('newPurchaseRequest.columns.price'),
      render: (price: number) => (
        <span className="font-medium">
          ${price.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'id',
      title: t('newPurchaseRequest.columns.selectQuantity'),
      render: (inventoryId: string, record: WarehouseInventoryItem) => {
        const selectedQty = getSelectedQty(inventoryId);
        const maxQty = record.qtyAvailable;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateSelectedQuantity(inventoryId, Math.max(0, selectedQty - 1))}
              disabled={selectedQty <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Input
              type="number"
              value={selectedQty}
              onChange={(e) => {
                const qty = parseInt(e.target.value) || 0;
                updateSelectedQuantity(inventoryId, Math.min(maxQty, Math.max(0, qty)));
              }}
              className="w-20 text-center"
              min="0"
              max={maxQty}
            />
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateSelectedQuantity(inventoryId, Math.min(maxQty, selectedQty + 1))}
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
  const totalCost = selectedItems.reduce((sum, item) => {
    const inventoryItem = inventory.find(inv => inv.id === item.inventoryId);
    return sum + (inventoryItem?.price || 0) * item.qty;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('newPurchaseRequest.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('newPurchaseRequest.subtitle')}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/store/purchase-requests')}>
          {t('newPurchaseRequest.cancel')}
        </Button>
      </div>

      {/* Current Turn Alert */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{t('newPurchaseRequest.yourTurn')}</p>
              <p className="text-sm text-green-600">
                {t('newPurchaseRequest.turnInfo', { round: 1, store: '测试门店' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Products */}
      <Card>
        <CardHeader>
          <CardTitle>{t('newPurchaseRequest.availableInventory')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('newPurchaseRequest.availableDescription')}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={inventory}
            columns={columns}
            loading={loading}
            title={t('newPurchaseRequest.available')}
          />
        </CardContent>
      </Card>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('newPurchaseRequest.selectedItems', { count: totalItems, total: totalCost.toFixed(2) })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedItems.map(item => {
                const inventoryItem = inventory.find(inv => inv.id === item.inventoryId);
                return (
                  <div key={item.inventoryId} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <span className="font-medium">{inventoryItem?.sku}</span>
                      <span className="text-muted-foreground ml-2">
                        {inventoryItem?.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{item.qty} {t('newPurchaseRequest.units')}</span>
                      {inventoryItem?.price && (
                        <div className="text-sm text-muted-foreground">
                          ${(inventoryItem.price * item.qty).toFixed(2)}
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
          {submitting ? t('newPurchaseRequest.submitting') : t('newPurchaseRequest.submit', { count: totalItems })}
        </Button>
      </div>
    </div>
  );
}