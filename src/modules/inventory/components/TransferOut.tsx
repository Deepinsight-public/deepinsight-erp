import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus, Package, Building2, Save, Truck, Edit, Trash2, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { TransferOrder, TransferItem, ItemEvent } from '../types';

interface TransferOutProps {
  storeId: string;
}

interface AvailableInventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  rfidTag?: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
}

const mockDraftOrders: TransferOrder[] = [
  {
    id: '1',
    transferNumber: 'TOUT-DRAFT-001',
    fromStoreId: 'store-1',
    fromStoreName: 'Store 1 - Main',
    toStoreId: 'store-2',
    toStoreName: 'Store 2 - Downtown',
    status: 'draft',
    items: [
      {
        id: '1',
        productId: 'p1',
        sku: 'WBH-001',
        productName: 'Wireless Bluetooth Headphones',
        brand: 'Sony',
        model: 'WH-1000XM4',
        serialNumber: 'SN001',
        rfidTag: 'RFID001',
        quantityRequested: 5,
        quantityShipped: 0,
        quantityReceived: 0,
        status: 'in_stock',
      }
    ],
    reason: 'Stock balancing',
    notes: 'Transfer for seasonal demand',
    createdBy: 'John Doe',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  }
];

export function TransferOut({ storeId }: TransferOutProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [draftOrders, setDraftOrders] = useState<TransferOrder[]>(mockDraftOrders);
  const [selectedOrder, setSelectedOrder] = useState<TransferOrder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<TransferOrder>>({
    toStoreId: '',
    notes: '',
    reason: '',
    items: []
  });
  const [loading, setLoading] = useState(false);

  // Handle creating a new draft order
  const handleCreateDraft = async () => {
    if (!newOrder.toStoreId) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.errors.selectDestination'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const draftOrder: TransferOrder = {
        id: `draft-${Date.now()}`,
        transferNumber: `TOUT-DRAFT-${String(draftOrders.length + 1).padStart(3, '0')}`,
        fromStoreId: storeId,
        fromStoreName: 'Store 1 - Main', // Would come from store context
        toStoreId: newOrder.toStoreId!,
        toStoreName: getStoreName(newOrder.toStoreId!),
        status: 'draft',
        items: [],
        reason: newOrder.reason,
        notes: newOrder.notes,
        createdBy: 'Current User', // Would come from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDraftOrders([...draftOrders, draftOrder]);
      setNewOrder({ toStoreId: '', notes: '', reason: '', items: [] });
      setIsCreating(false);
      
      toast({
        title: t('success'),
        description: t('inventory.transfers.transferOut.draftCreated'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.transferOut.error'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle shipping a draft order
  const handleShipOrder = async (order: TransferOrder) => {
    if (order.items.length === 0) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.errors.noItemsToShip'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Update order status to shipped
      const shippedOrder = {
        ...order,
        status: 'shipped' as const,
        shippedAt: new Date().toISOString(),
        shippedBy: 'Current User',
        items: order.items.map(item => ({
          ...item,
          status: 'transit' as const,
          quantityShipped: item.quantityRequested
        }))
      };

      setDraftOrders(draftOrders.filter(o => o.id !== order.id));
      setSelectedOrder(null);

      // Create audit trail events
      const auditEvents: ItemEvent[] = order.items.map(item => ({
        id: `event-${Date.now()}-${item.id}`,
        itemId: item.id,
        eventType: 'transfer_out',
        fromStoreId: order.fromStoreId,
        toStoreId: order.toStoreId,
        fromStatus: 'in_stock',
        toStatus: 'transit',
        transferOrderId: order.id,
        performedBy: 'Current User',
        timestamp: new Date().toISOString(),
        notes: `Shipped via transfer ${order.transferNumber}`
      }));

      console.log('Audit events created:', auditEvents);
      
      toast({
        title: t('success'),
        description: t('inventory.transfers.transferOut.shipped', { 
          transferNumber: order.transferNumber 
        }),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.transferOut.shipError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancelling a draft order
  const handleCancelOrder = async (order: TransferOrder) => {
    if (order.status !== 'draft') {
      toast({
        title: t('error'),
        description: t('inventory.transfers.errors.cannotCancelShipped'),
        variant: 'destructive'
      });
      return;
    }

    setDraftOrders(draftOrders.filter(o => o.id !== order.id));
    setSelectedOrder(null);
    
    toast({
      title: t('success'),
      description: t('inventory.transfers.transferOut.cancelled'),
    });
  };

  const getStoreName = (storeId: string) => {
    const storeNames: Record<string, string> = {
      'store-2': 'Store 2 - Downtown',
      'store-3': 'Store 3 - Mall',
      'warehouse-1': 'Warehouse 1 - Central'
    };
    return storeNames[storeId] || storeId;
  };

  const getStatusBadge = (status: TransferOrder['status']) => {
    const variants = {
      draft: 'secondary',
      shipped: 'default',
      received: 'success',
      cancelled: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]}>
        {t(`inventory.transfers.status.${status}`)}
      </Badge>
    );
  };

  const draftOrderColumns = [
    {
      key: 'transferNumber',
      title: t('inventory.transfers.transferNumber'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'toStoreName',
      title: t('inventory.transfers.destination'),
      render: (value: string) => value,
    },
    {
      key: 'status',
      title: t('inventory.transfers.status.title'),
      render: (value: TransferOrder['status']) => getStatusBadge(value),
    },
    {
      key: 'items',
      title: t('inventory.transfers.itemCount'),
      render: (value: TransferItem[]) => (
        <span className="text-sm">{value.length} items</span>
      ),
    },
    {
      key: 'createdAt',
      title: t('inventory.transfers.created'),
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const orderItemColumns = [
    {
      key: 'productName',
      title: t('inventory.columns.product'),
      render: (value: string, record: TransferItem) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">
            SKU: {record.sku} {record.serialNumber && `| SN: ${record.serialNumber}`}
          </div>
        </div>
      ),
    },
    {
      key: 'quantityRequested',
      title: t('inventory.transfers.quantity'),
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'status',
      title: t('inventory.transfers.itemStatus'),
      render: (value: string) => (
        <Badge variant={value === 'in_stock' ? 'secondary' : value === 'transit' ? 'default' : 'success'}>
          {t(`inventory.transfers.itemStatuses.${value}`)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/store/inventory'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('actions.goBack')}
            </Button>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ArrowRight className="h-6 w-6 text-red-500" />
                {t('inventory.transfers.transferOut.title')}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t('inventory.transfers.transferOut.workflowDescription')}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          {t('inventory.transfers.transferOut.createDraft')}
        </Button>
      </div>

      {!selectedOrder ? (
        // Draft Orders List
        <Card>
          <CardHeader>
            <CardTitle>{t('inventory.transfers.transferOut.draftOrders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={draftOrders}
              columns={draftOrderColumns}
              onRowClick={setSelectedOrder}
              title={t('inventory.transfers.transferOut.draftsList')}
            />
          </CardContent>
        </Card>
      ) : (
        // Draft Order Editor
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t('inventory.transfers.transferOut.orderDetails')}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                    {t('actions.back')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('inventory.transfers.transferNumber')}</Label>
                  <p className="font-medium">{selectedOrder.transferNumber}</p>
                </div>
                
                <div>
                  <Label>{t('inventory.transfers.destination')}</Label>
                  <p className="font-medium">{selectedOrder.toStoreName}</p>
                </div>

                <div>
                  <Label>{t('inventory.transfers.status.title')}</Label>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div>
                  <Label>{t('inventory.transfers.reason')}</Label>
                  <p className="text-sm">{selectedOrder.reason || '-'}</p>
                </div>

                <div>
                  <Label>{t('inventory.transfers.notes')}</Label>
                  <p className="text-sm">{selectedOrder.notes || '-'}</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('inventory.transfers.totalItems')}:</span>
                    <span className="font-medium">{selectedOrder.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('inventory.transfers.totalQuantity')}:</span>
                    <span className="font-medium">
                      {selectedOrder.items.reduce((sum, item) => sum + item.quantityRequested, 0)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleShipOrder(selectedOrder)} 
                    disabled={loading || selectedOrder.items.length === 0 || selectedOrder.status !== 'draft'}
                    className="flex-1"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {t('inventory.transfers.transferOut.ship')}
                  </Button>
                </div>

                {selectedOrder.status === 'draft' && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleCancelOrder(selectedOrder)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('actions.cancel')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('inventory.transfers.transferOut.orderItems')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder.items.length > 0 ? (
                  <DataTable
                    data={selectedOrder.items}
                    columns={orderItemColumns}
                    title={t('inventory.transfers.transferOut.itemsList')}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('inventory.transfers.transferOut.noItems')}</p>
                    <Button variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('inventory.transfers.transferOut.addItems')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create New Draft Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inventory.transfers.transferOut.createDraft')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="destination">{t('inventory.transfers.destination')}</Label>
              <Select value={newOrder.toStoreId} onValueChange={(value) => setNewOrder({...newOrder, toStoreId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.transfers.selectDestination')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store-2">Store 2 - Downtown</SelectItem>
                  <SelectItem value="store-3">Store 3 - Mall</SelectItem>
                  <SelectItem value="warehouse-1">Warehouse 1 - Central</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">{t('inventory.transfers.reason')}</Label>
              <Input
                id="reason"
                value={newOrder.reason || ''}
                onChange={(e) => setNewOrder({...newOrder, reason: e.target.value})}
                placeholder={t('inventory.transfers.reasonPlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="notes">{t('inventory.transfers.notes')}</Label>
              <Textarea
                id="notes"
                value={newOrder.notes || ''}
                onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                placeholder={t('inventory.transfers.notesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateDraft} disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {t('inventory.transfers.transferOut.saveDraft')}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                {t('actions.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}