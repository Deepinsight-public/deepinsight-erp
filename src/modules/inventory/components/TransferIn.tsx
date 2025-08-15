import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Package, Clock, AlertCircle, Scan, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { TransferOrder, TransferItem, ItemEvent } from '../types';

interface TransferInProps {
  storeId: string;
}

const mockShippedTransfers: TransferOrder[] = [
  {
    id: '1',
    transferNumber: 'TIN-2024-001',
    fromStoreId: 'store-2',
    fromStoreName: 'Store 2 - Downtown',
    toStoreId: 'store-1',
    toStoreName: 'Store 1 - Main',
    status: 'shipped',
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
        quantityShipped: 5,
        quantityReceived: 0,
        status: 'transit',
        condition: 'good',
      },
      {
        id: '2',
        productId: 'p2',
        sku: 'USC-002',
        productName: 'USB-C Cable',
        brand: 'Anker',
        model: 'PowerLine+',
        serialNumber: 'SN002',
        rfidTag: 'RFID002',
        quantityRequested: 10,
        quantityShipped: 10,
        quantityReceived: 0,
        status: 'transit',
        condition: 'good',
      },
    ],
    shippingNotes: 'Urgent transfer for stock shortage',
    createdBy: 'Jane Smith',
    shippedBy: 'John Doe',
    createdAt: '2024-01-12T08:00:00Z',
    shippedAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-01-15T14:00:00Z',
  },
];

export function TransferIn({ storeId }: TransferInProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [shippedTransfers, setShippedTransfers] = useState<TransferOrder[]>(mockShippedTransfers);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferOrder | null>(null);
  const [receivingNotes, setReceivingNotes] = useState('');
  const [scanMode, setScanMode] = useState<'rfid' | 'manual'>('rfid');
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (status: TransferOrder['status']) => {
    switch (status) {
      case 'draft':
        return <Package className="h-4 w-4 text-gray-500" />;
      case 'shipped':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TransferOrder['status']) => {
    const variants = {
      draft: 'secondary',
      shipped: 'default',
      received: 'success',
      cancelled: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {t(`inventory.transfers.status.${status}`)}
      </Badge>
    );
  };

  const getItemStatusBadge = (item: TransferItem) => {
    if (item.quantityReceived === item.quantityShipped) {
      return <Badge variant="success">{t('inventory.transfers.itemStatuses.received')}</Badge>;
    } else if (item.quantityReceived > 0) {
      return <Badge variant="secondary">{t('inventory.transfers.itemStatuses.partial')}</Badge>;
    } else {
      return <Badge variant="outline">{t('inventory.transfers.itemStatuses.pending')}</Badge>;
    }
  };

  const handleScanItem = async (rfidOrSku: string) => {
    if (!selectedTransfer) return;

    const itemToUpdate = selectedTransfer.items.find(
      item => item.rfidTag === rfidOrSku || item.sku === rfidOrSku || item.serialNumber === rfidOrSku
    );

    if (!itemToUpdate) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.transferIn.itemNotFound'),
        variant: 'destructive'
      });
      return;
    }

    if (itemToUpdate.quantityReceived >= itemToUpdate.quantityShipped) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.transferIn.alreadyReceived'),
        variant: 'destructive'
      });
      return;
    }

    // Update item as scanned
    const updatedItems = selectedTransfer.items.map(item =>
      item.id === itemToUpdate.id
        ? {
            ...item,
            quantityReceived: item.quantityReceived + 1,
            scannedAt: new Date().toISOString(),
            condition: 'good' as const
          }
        : item
    );

    setSelectedTransfer({
      ...selectedTransfer,
      items: updatedItems
    });

    setScanInput('');
    
    toast({
      title: t('success'),
      description: t('inventory.transfers.transferIn.itemScanned', { 
        product: itemToUpdate.productName 
      }),
    });
  };

  const handleReceiveTransfer = async () => {
    if (!selectedTransfer) return;

    const totalExpected = selectedTransfer.items.reduce((sum, item) => sum + item.quantityShipped, 0);
    const totalReceived = selectedTransfer.items.reduce((sum, item) => sum + item.quantityReceived, 0);

    if (totalReceived === 0) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.transferIn.nothingScanned'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Mark transfer as received
      const receivedTransfer = {
        ...selectedTransfer,
        status: 'received' as const,
        receivedAt: new Date().toISOString(),
        receivedBy: 'Current User',
        receivingNotes,
        items: selectedTransfer.items.map(item => ({
          ...item,
          status: item.quantityReceived > 0 ? 'received' as const : 'transit' as const
        }))
      };

      // Create audit trail events for received items
      const auditEvents: ItemEvent[] = selectedTransfer.items
        .filter(item => item.quantityReceived > 0)
        .map(item => ({
          id: `event-${Date.now()}-${item.id}`,
          itemId: item.id,
          eventType: 'transfer_in',
          fromStoreId: selectedTransfer.fromStoreId,
          toStoreId: selectedTransfer.toStoreId,
          fromStatus: 'transit',
          toStatus: 'in_stock',
          transferOrderId: selectedTransfer.id,
          performedBy: 'Current User',
          timestamp: new Date().toISOString(),
          notes: `Received ${item.quantityReceived}/${item.quantityShipped} units via transfer ${selectedTransfer.transferNumber}`
        }));

      console.log('Received transfer:', receivedTransfer);
      console.log('Audit events created:', auditEvents);

      // Update store inventory counts and item statuses would happen here
      
      setShippedTransfers(shippedTransfers.filter(t => t.id !== selectedTransfer.id));
      setSelectedTransfer(null);
      setReceivingNotes('');
      
      const isPartialReceipt = totalReceived < totalExpected;
      
      toast({
        title: t('success'),
        description: isPartialReceipt 
          ? t('inventory.transfers.transferIn.partialSuccess', { 
              received: totalReceived, 
              expected: totalExpected 
            })
          : t('inventory.transfers.transferIn.success'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('inventory.transfers.transferIn.error'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const transferColumns = [
    {
      key: 'transferNumber',
      title: t('inventory.transfers.transferNumber'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'fromStoreName',
      title: t('inventory.transfers.source'),
      render: (value: string) => value,
    },
    {
      key: 'status',
      title: t('inventory.transfers.status.title'),
      render: (value: TransferOrder['status']) => getStatusBadge(value),
    },
    {
      key: 'shippedAt',
      title: t('inventory.transfers.shippedDate'),
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      key: 'items',
      title: t('inventory.transfers.itemCount'),
      render: (value: TransferItem[]) => {
        const totalShipped = value.reduce((sum, item) => sum + item.quantityShipped, 0);
        return <span className="text-sm">{value.length} items ({totalShipped} units)</span>;
      },
    },
  ];

  const itemColumns = [
    {
      key: 'productName',
      title: t('inventory.columns.product'),
      render: (value: string, record: TransferItem) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">
            SKU: {record.sku} | SN: {record.serialNumber}
          </div>
          {record.rfidTag && (
            <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <Radio className="h-3 w-3" />
              RFID: {record.rfidTag}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'quantityShipped',
      title: t('inventory.transfers.shipped'),
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'quantityReceived',
      title: t('inventory.transfers.received'),
      render: (value: number, record: TransferItem) => (
        <div className="flex items-center gap-2">
          <span className={value === record.quantityShipped ? 'text-green-600 font-medium' : 'font-medium'}>
            {value}
          </span>
          {record.scannedAt && (
            <Badge variant="outline" className="text-xs">
              {t('inventory.transfers.scanned')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: t('inventory.transfers.status.title'),
      render: (value: string, record: TransferItem) => getItemStatusBadge(record),
    },
  ];

  const getReceivingProgress = () => {
    if (!selectedTransfer) return 0;
    const totalShipped = selectedTransfer.items.reduce((sum, item) => sum + item.quantityShipped, 0);
    const totalReceived = selectedTransfer.items.reduce((sum, item) => sum + item.quantityReceived, 0);
    return totalShipped > 0 ? (totalReceived / totalShipped) * 100 : 0;
  };

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
                <ArrowLeft className="h-6 w-6 text-green-500" />
                {t('inventory.transfers.transferIn.title')}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t('inventory.transfers.transferIn.workflowDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!selectedTransfer ? (
        // Inbound Transfers List
        <Card>
          <CardHeader>
            <CardTitle>{t('inventory.transfers.transferIn.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={shippedTransfers.filter(t => t.status === 'shipped')}
              columns={transferColumns}
              onRowClick={setSelectedTransfer}
              title={t('inventory.transfers.transferIn.list')}
              description={t('inventory.transfers.transferIn.listDescription')}
            />
          </CardContent>
        </Card>
      ) : (
        // Transfer Receiving Interface
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('inventory.transfers.transferIn.receiving')}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTransfer(null)}>
                    {t('actions.back')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('inventory.transfers.transferNumber')}</Label>
                  <p className="font-medium">{selectedTransfer.transferNumber}</p>
                </div>
                
                <div>
                  <Label>{t('inventory.transfers.source')}</Label>
                  <p className="font-medium">{selectedTransfer.fromStoreName}</p>
                </div>

                <div>
                  <Label>{t('inventory.transfers.shippedDate')}</Label>
                  <p className="font-medium">
                    {selectedTransfer.shippedAt 
                      ? new Date(selectedTransfer.shippedAt).toLocaleDateString()
                      : '-'
                    }
                  </p>
                </div>

                {/* Receiving Progress */}
                <div>
                  <Label>{t('inventory.transfers.transferIn.progress')}</Label>
                  <div className="mt-2">
                    <Progress value={getReceivingProgress()} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTransfer.items.reduce((sum, item) => sum + item.quantityReceived, 0)} / {' '}
                      {selectedTransfer.items.reduce((sum, item) => sum + item.quantityShipped, 0)} units
                    </p>
                  </div>
                </div>

                {/* RFID Scanner */}
                <div>
                  <Label>{t('inventory.transfers.transferIn.scanner')}</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1">
                      <Input
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder={t('inventory.transfers.transferIn.scanPlaceholder')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && scanInput.trim()) {
                            handleScanItem(scanInput.trim());
                          }
                        }}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => scanInput.trim() && handleScanItem(scanInput.trim())}
                      disabled={!scanInput.trim()}
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('inventory.transfers.transferIn.scanHint')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="receivingNotes">{t('inventory.transfers.receivingNotes')}</Label>
                  <Textarea
                    id="receivingNotes"
                    value={receivingNotes}
                    onChange={(e) => setReceivingNotes(e.target.value)}
                    placeholder={t('inventory.transfers.receivingNotesPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleReceiveTransfer} 
                    disabled={loading}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('inventory.transfers.transferIn.receive')}
                  </Button>
                </div>

                {/* Partial Receipt Warning */}
                {selectedTransfer.items.some(item => item.quantityReceived > 0) && 
                 selectedTransfer.items.some(item => item.quantityReceived < item.quantityShipped) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('inventory.transfers.transferIn.partialWarning')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('inventory.transfers.transferIn.items')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={selectedTransfer.items}
                  columns={itemColumns}
                  title={t('inventory.transfers.transferIn.itemsToReceive')}
                  description={t('inventory.transfers.transferIn.itemsDescription')}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}