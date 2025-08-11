import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Package, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { toast } from 'sonner';
import { inventoryApi } from '../api/inventory';
import type { PurchaseRequest, CreatePurchaseRequest, PurchaseRequestItem } from '../types/inventory';

interface PurchaseManagementProps {
  storeId: string;
}

export function PurchaseManagement({ storeId }: PurchaseManagementProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form state
  const [items, setItems] = useState<PurchaseRequestItem[]>([
    { sku: '', productName: '', quantity: 1, notes: '' }
  ]);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadRequests();
  }, [storeId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getPurchaseRequests(storeId);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load purchase requests:', error);
      toast.error(t('inventory.purchase.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    const validItems = items.filter(item => 
      item.sku?.trim() || item.productName?.trim()
    );

    if (validItems.length === 0) {
      toast.error(t('inventory.purchase.validation.noItems'));
      return;
    }

    try {
      const request: CreatePurchaseRequest = {
        items: validItems.map(item => ({
          ...item,
          sku: item.sku?.trim(),
          productName: item.productName?.trim(),
          notes: item.notes?.trim(),
        })),
        remarks: remarks.trim() || undefined,
      };

      await inventoryApi.createPurchaseRequest(storeId, request);
      
      toast.success(t('inventory.purchase.createSuccess'));
      setCreateDialogOpen(false);
      resetForm();
      loadRequests();
    } catch (error) {
      console.error('Failed to create purchase request:', error);
      toast.error(t('inventory.purchase.createError'));
    }
  };

  const resetForm = () => {
    setItems([{ sku: '', productName: '', quantity: 1, notes: '' }]);
    setRemarks('');
  };

  const addItem = () => {
    setItems([...items, { sku: '', productName: '', quantity: 1, notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseRequestItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: t('inventory.purchase.status.pending'), icon: Clock },
      approved: { variant: 'default', label: t('inventory.purchase.status.approved'), icon: CheckCircle },
      cancelled: { variant: 'destructive', label: t('inventory.purchase.status.cancelled'), icon: null },
      completed: { variant: 'default', label: t('inventory.purchase.status.completed'), icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'id',
      title: t('inventory.purchase.columns.requestId'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: 'items',
      title: t('inventory.purchase.columns.items'),
      render: (value: PurchaseRequestItem[]) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{value?.length || 0} {t('inventory.purchase.columns.itemsCount')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('inventory.purchase.columns.status'),
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'remarks',
      title: t('inventory.purchase.columns.remarks'),
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: t('inventory.purchase.columns.created'),
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: t('inventory.purchase.columns.actions'),
      render: (value: any, record: PurchaseRequest) => (
        <div className="flex gap-2">
          {record.status === 'approved' && (
            <Button size="sm" variant="outline">
              {t('inventory.purchase.actions.trackDelivery')}
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
          <h2 className="text-2xl font-semibold">{t('inventory.purchase.title')}</h2>
          <p className="text-muted-foreground">{t('inventory.purchase.description')}</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.purchase.actions.create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('inventory.purchase.create.title')}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Items */}
              <div className="space-y-4">
                <Label className="text-base font-medium">{t('inventory.purchase.create.items')}</Label>
                
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-4 border rounded-lg">
                    <div className="col-span-3">
                      <Label className="text-xs">{t('inventory.purchase.create.sku')}</Label>
                      <Input
                        placeholder="SKU"
                        value={item.sku || ''}
                        onChange={(e) => updateItem(index, 'sku', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">{t('inventory.purchase.create.productName')}</Label>
                      <Input
                        placeholder={t('inventory.purchase.create.productNamePlaceholder')}
                        value={item.productName || ''}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">{t('inventory.purchase.create.quantity')}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">{t('inventory.purchase.create.notes')}</Label>
                      <Input
                        placeholder={t('inventory.purchase.create.notesPlaceholder')}
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inventory.purchase.create.addItem')}
                </Button>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>{t('inventory.purchase.create.remarks')}</Label>
                <Textarea
                  placeholder={t('inventory.purchase.create.remarksPlaceholder')}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateRequest}>
                  {t('inventory.purchase.actions.submit')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium text-primary">{t('inventory.purchase.info.title')}</h3>
            <p className="text-sm text-primary/80 mt-1">
              {t('inventory.purchase.info.description')}
            </p>
          </div>
        </div>
      </div>

      <DataTable
        data={requests}
        columns={columns}
        loading={loading}
        title={t('inventory.purchase.list.title')}
        emptyMessage={t('inventory.purchase.list.empty')}
      />
    </div>
  );
}