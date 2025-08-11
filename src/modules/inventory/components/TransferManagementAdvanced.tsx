import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Truck, Package, ArrowRight, Building, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { toast } from 'sonner';
import { inventoryApi } from '../api/inventory';
import type { TransferOrder, CreateTransferRequest, Store, Warehouse } from '../types/inventory';

interface TransferManagementAdvancedProps {
  storeId: string;
}

export function TransferManagementAdvanced({ storeId }: TransferManagementAdvancedProps) {
  const { t } = useTranslation();
  const [transferOut, setTransferOut] = useState<TransferOrder[]>([]);
  const [transferIn, setTransferIn] = useState<TransferOrder[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form state
  const [destinationType, setDestinationType] = useState<'store' | 'warehouse'>('store');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [itemEPCs, setItemEPCs] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [outData, inData, storesData, warehousesData] = await Promise.all([
        inventoryApi.getTransferOut(storeId),
        inventoryApi.getTransferIn(storeId),
        inventoryApi.getStores(),
        inventoryApi.getWarehouses(),
      ]);
      
      setTransferOut(outData);
      setTransferIn(inData);
      setStores(storesData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load transfer data:', error);
      toast.error(t('inventory.transfer.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    if (!selectedDestination || !itemEPCs.trim()) {
      toast.error(t('inventory.transfer.validationError'));
      return;
    }

    try {
      const epcs = itemEPCs.split('\n').map(epc => epc.trim()).filter(Boolean);
      
      const request: CreateTransferRequest = {
        toStoreId: selectedDestination,
        itemEPCs: epcs,
        reason: reason.trim() || undefined,
      };

      await inventoryApi.createTransferOut(storeId, request);
      
      toast.success(t('inventory.transfer.createSuccess'));
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create transfer:', error);
      toast.error(t('inventory.transfer.createError'));
    }
  };

  const handleShipTransfer = async (transferId: string) => {
    try {
      await inventoryApi.shipTransfer(transferId);
      toast.success(t('inventory.transfer.shipSuccess'));
      loadData();
    } catch (error) {
      console.error('Failed to ship transfer:', error);
      toast.error(t('inventory.transfer.shipError'));
    }
  };

  const handleReceiveTransfer = async (transferId: string) => {
    // For now, receive all items. In a real implementation, 
    // this would open a dialog for EPC scanning and selective receiving
    try {
      await inventoryApi.receiveTransfer(transferId, []); // Empty array means receive all
      toast.success(t('inventory.transfer.receiveSuccess'));
      loadData();
    } catch (error) {
      console.error('Failed to receive transfer:', error);
      toast.error(t('inventory.transfer.receiveError'));
    }
  };

  const resetForm = () => {
    setDestinationType('store');
    setSelectedDestination('');
    setItemEPCs('');
    setReason('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary', label: t('inventory.transfer.status.draft') },
      SUBMITTED: { variant: 'default', label: t('inventory.transfer.status.submitted') },
      SHIPPED: { variant: 'default', label: t('inventory.transfer.status.shipped') },
      RECEIVED: { variant: 'default', label: t('inventory.transfer.status.received') },
      CANCELLED: { variant: 'destructive', label: t('inventory.transfer.status.cancelled') },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const transferOutColumns = [
    {
      key: 'docNo',
      title: t('inventory.transfer.columns.docNo'),
      render: (value: string) => (
        <span className="font-mono font-medium">{value}</span>
      ),
    },
    {
      key: 'toStoreName',
      title: t('inventory.transfer.columns.destination'),
      render: (value: string, record: TransferOrder) => (
        <div className="flex items-center gap-2">
          {record.kind === 'STORE_TO_WAREHOUSE' ? (
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Building className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{value || record.toStoreId}</span>
        </div>
      ),
    },
    {
      key: 'itemCount',
      title: t('inventory.transfer.columns.itemCount'),
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('inventory.transfer.columns.status'),
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'createdAt',
      title: t('inventory.transfer.columns.created'),
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: t('inventory.transfer.columns.actions'),
      render: (value: any, record: TransferOrder) => (
        <div className="flex gap-2">
          {record.status === 'DRAFT' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleShipTransfer(record.id)}
            >
              <Truck className="h-4 w-4 mr-1" />
              {t('inventory.transfer.actions.ship')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const transferInColumns = [
    {
      key: 'docNo',
      title: t('inventory.transfer.columns.docNo'),
      render: (value: string) => (
        <span className="font-mono font-medium">{value}</span>
      ),
    },
    {
      key: 'fromStoreName',
      title: t('inventory.transfer.columns.source'),
      render: (value: string, record: TransferOrder) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span>{value || record.fromStoreId}</span>
        </div>
      ),
    },
    {
      key: 'itemCount',
      title: t('inventory.transfer.columns.itemCount'),
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('inventory.transfer.columns.status'),
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'createdAt',
      title: t('inventory.transfer.columns.shipped'),
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: t('inventory.transfer.columns.actions'),
      render: (value: any, record: TransferOrder) => (
        <div className="flex gap-2">
          {record.status === 'SHIPPED' && (
            <Button 
              size="sm" 
              onClick={() => handleReceiveTransfer(record.id)}
            >
              <Package className="h-4 w-4 mr-1" />
              {t('inventory.transfer.actions.receive')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('inventory.transfer.title')}</h2>
          <p className="text-muted-foreground">{t('inventory.transfer.description')}</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.transfer.actions.createOut')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('inventory.transfer.create.title')}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Destination Type */}
              <div className="space-y-2">
                <Label>{t('inventory.transfer.create.destinationType')}</Label>
                <Select value={destinationType} onValueChange={(value: 'store' | 'warehouse') => {
                  setDestinationType(value);
                  setSelectedDestination('');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {t('inventory.transfer.create.toStore')}
                      </div>
                    </SelectItem>
                    <SelectItem value="warehouse">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4" />
                        {t('inventory.transfer.create.toWarehouse')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Selection */}
              <div className="space-y-2">
                <Label>{t('inventory.transfer.create.destination')}</Label>
                <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('inventory.transfer.create.selectDestination')} />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationType === 'store' 
                      ? stores.filter(store => store.id !== storeId).map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{store.storeName} ({store.storeCode})</span>
                            </div>
                          </SelectItem>
                        ))
                      : warehouses.map(warehouse => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            <div className="flex items-center gap-2">
                              <Warehouse className="h-4 w-4" />
                              <span>{warehouse.warehouseName} ({warehouse.warehouseCode})</span>
                            </div>
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Item EPCs */}
              <div className="space-y-2">
                <Label>{t('inventory.transfer.create.itemEPCs')}</Label>
                <Textarea
                  placeholder={t('inventory.transfer.create.epcPlaceholder')}
                  value={itemEPCs}
                  onChange={(e) => setItemEPCs(e.target.value)}
                  rows={6}
                />
                <div className="text-sm text-muted-foreground">
                  {t('inventory.transfer.create.epcHint')}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>{t('inventory.transfer.create.reason')}</Label>
                <Input
                  placeholder={t('inventory.transfer.create.reasonPlaceholder')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateTransfer}>
                  {t('inventory.transfer.actions.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="out" className="w-full">
        <TabsList>
          <TabsTrigger value="out" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            {t('inventory.transfer.tabs.transferOut')}
          </TabsTrigger>
          <TabsTrigger value="in" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('inventory.transfer.tabs.transferIn')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="out" className="mt-6">
          <DataTable
            data={transferOut}
            columns={transferOutColumns}
            loading={loading}
            title={t('inventory.transfer.out.title')}
            emptyMessage={t('inventory.transfer.out.empty')}
          />
        </TabsContent>

        <TabsContent value="in" className="mt-6">
          <DataTable
            data={transferIn}
            columns={transferInColumns}
            loading={loading}
            title={t('inventory.transfer.in.title')}
            emptyMessage={t('inventory.transfer.in.empty')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}