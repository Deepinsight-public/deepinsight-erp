import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Square, Scan, Download, History, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { toast } from 'sonner';
import { inventoryApi } from '@/modules/inventory/api/inventory';
import type { InventoryItem } from '@/modules/inventory/types';

interface StockCountManagementProps {
  storeId: string;
}

export function StockCountManagement({ storeId }: StockCountManagementProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [scanInput, setScanInput] = useState('');
  const [expectedItems, setExpectedItems] = useState<InventoryItem[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [showVarianceDialog, setShowVarianceDialog] = useState(false);

  useEffect(() => {
    loadExpectedItems();
    loadScanHistory();
  }, [storeId]);

  const loadExpectedItems = async () => {
    try {
      const items = await inventoryApi.getInventory(storeId, { 
        status: 'active',
        limit: 1000 
      });
      setExpectedItems(items);
    } catch (error) {
      console.error('Failed to load expected items:', error);
    }
  };

  const loadScanHistory = async () => {
    try {
      const logs = await inventoryApi.getScanLogs(storeId);
      setScanHistory(logs.filter(log => log.action?.includes('COUNT')));
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  const startStockCount = () => {
    const docId = `SC-${storeId.slice(-4)}-${new Date().toISOString().replace(/[^\d]/g, '').slice(0, 12)}`;
    
    const session = {
      docId,
      status: 'active' as const,
      startTime: new Date().toISOString(),
      scannedItems: [],
      expectedItems,
      variance: {
        missing: [],
        extra: [],
        found: [],
      },
    };

    setCurrentSession(session);
    
    // Log start event
    inventoryApi.createScanLog(storeId, {
      epc: 'SESSION_START',
      action: 'COUNT_START',
      docType: 'STOCKCOUNT',
      docId,
    }).catch(console.error);

    toast.success(t('inventory.stockCount.startSuccess'));
  };

  const handleScan = async () => {
    if (!currentSession || !scanInput.trim()) {
      toast.error(t('inventory.stockCount.scanError'));
      return;
    }

    const epc = scanInput.trim();
    
    try {
      // Find item by EPC - mock since we don't have actual EPC data
      const item = expectedItems.find(item => item.sku === epc); // Using SKU as mock EPC
      
      if (!item) {
        toast.warning(t('inventory.stockCount.itemNotFound', { epc }));
        return;
      }

      // Check if already scanned
      const alreadyScanned = currentSession.scannedItems.find((scanned: any) => scanned.sku === epc);
      if (alreadyScanned) {
        toast.warning(t('inventory.stockCount.alreadyScanned'));
        return;
      }

      // Add to scanned items
      const updatedSession = {
        ...currentSession,
        scannedItems: [...currentSession.scannedItems, item],
      };
      setCurrentSession(updatedSession);

      // Log scan event
      await inventoryApi.createScanLog(storeId, {
        epc,
        itemId: item.id,
        action: 'COUNT_SCAN',
        docType: 'STOCKCOUNT',
        docId: currentSession.docId,
      });

      setScanInput('');
      toast.success(t('inventory.stockCount.scanSuccess'));
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error(t('inventory.stockCount.scanFailed'));
    }
  };

  const finishStockCount = async () => {
    if (!currentSession) return;

    try {
      // Calculate variance - using SKU as mock EPC
      const scannedSKUs = new Set(currentSession.scannedItems.map((item: any) => item.sku));
      const expectedSKUs = new Set(expectedItems.map(item => item.sku));

      const missing = expectedItems.filter(item => !scannedSKUs.has(item.sku));
      const extra = currentSession.scannedItems.filter((item: any) => !expectedSKUs.has(item.sku));
      const found = currentSession.scannedItems.filter((item: any) => expectedSKUs.has(item.sku));

      const finalSession = {
        ...currentSession,
        status: 'completed' as const,
        endTime: new Date().toISOString(),
        variance: { missing, extra, found },
      };

      setCurrentSession(finalSession);

      // Log end event
      await inventoryApi.createScanLog(storeId, {
        epc: 'SESSION_END',
        action: 'COUNT_CLOSE',
        docType: 'STOCKCOUNT',
        docId: currentSession.docId,
      });

      setShowVarianceDialog(true);
      loadScanHistory();
      
      toast.success(t('inventory.stockCount.finishSuccess'));
    } catch (error) {
      console.error('Failed to finish stock count:', error);
      toast.error(t('inventory.stockCount.finishError'));
    }
  };

  const exportVariance = () => {
    if (!currentSession) return;

    const csvData = [
      ['Type', 'SKU', 'Product Name', 'Status'], // Using SKU instead of EPC
      ...currentSession.variance.missing.map((item: any) => ['Missing', item.sku, item.productName || '', item.status]),
      ...currentSession.variance.extra.map((item: any) => ['Extra', item.sku, item.productName || '', item.status]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-count-variance-${currentSession.docId}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success(t('inventory.stockCount.exportSuccess'));
  };

  const scannedColumns = [
    {
      key: 'sku',
      title: t('inventory.stockCount.columns.sku'),
      render: (value: string) => (
        <span className="font-mono font-medium">{value}</span>
      ),
    },
    {
      key: 'productName',
      title: t('inventory.stockCount.columns.product'),
      render: (value: string, record: InventoryItem) => (
        <div>
          <div className="font-medium">{value || record.sku}</div>
          <div className="text-sm text-muted-foreground">
            {record.brand} {record.model}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('inventory.stockCount.columns.status'),
      render: (value: string) => (
        <Badge variant="outline">{t(`inventory.status.${value}`)}</Badge>
      ),
    },
  ];

  const varianceColumns = [
    {
      key: 'type',
      title: t('inventory.stockCount.variance.type'),
      render: (value: string, record: any) => {
        const isMissing = currentSession?.variance.missing.includes(record);
        const isExtra = currentSession?.variance.extra.includes(record);
        
        if (isMissing) {
          return <Badge variant="destructive">{t('inventory.stockCount.variance.missing')}</Badge>;
        } else if (isExtra) {
          return <Badge variant="secondary">{t('inventory.stockCount.variance.extra')}</Badge>;
        } else {
          return <Badge variant="default">{t('inventory.stockCount.variance.found')}</Badge>;
        }
      },
    },
    ...scannedColumns,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('inventory.stockCount.title')}</h2>
          <p className="text-muted-foreground">{t('inventory.stockCount.description')}</p>
        </div>
        
        <div className="flex gap-2">
          {!currentSession ? (
            <Button onClick={startStockCount}>
              <Play className="h-4 w-4 mr-2" />
              {t('inventory.stockCount.actions.start')}
            </Button>
          ) : currentSession.status === 'active' ? (
            <Button variant="destructive" onClick={finishStockCount}>
              <Square className="h-4 w-4 mr-2" />
              {t('inventory.stockCount.actions.finish')}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-primary">
                {t('inventory.stockCount.session.title')} {currentSession.docId}
              </h3>
              <div className="text-sm text-primary/80 mt-1">
                {t('inventory.stockCount.session.started')}: {new Date(currentSession.startTime).toLocaleString()}
              </div>
              <div className="text-sm text-primary/80">
                {t('inventory.stockCount.session.progress')}: {currentSession.scannedItems.length} / {expectedItems.length}
              </div>
            </div>
            <Badge variant={currentSession.status === 'active' ? 'default' : 'secondary'}>
              {t(`inventory.stockCount.session.${currentSession.status}`)}
            </Badge>
          </div>
        </div>
      )}

      <Tabs defaultValue="scan" className="w-full">
        <TabsList>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            {t('inventory.stockCount.tabs.scan')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('inventory.stockCount.tabs.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-6 space-y-6">
          {currentSession?.status === 'active' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t('inventory.stockCount.scan.placeholder')}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  className="flex-1"
                />
                <Button onClick={handleScan}>
                  <Scan className="h-4 w-4 mr-2" />
                  {t('inventory.stockCount.actions.scan')}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {t('inventory.stockCount.scan.hint')}
              </div>
            </div>
          )}

          {currentSession && (
          <DataTable
            data={currentSession.scannedItems}
            columns={scannedColumns}
            title={t('inventory.stockCount.scanned.title', { count: currentSession.scannedItems.length })}
          />
          )}

          {!currentSession && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('inventory.stockCount.noActiveSession')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t('inventory.stockCount.history.empty')}</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Variance Dialog */}
      <Dialog open={showVarianceDialog} onOpenChange={setShowVarianceDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('inventory.stockCount.variance.title')}</DialogTitle>
          </DialogHeader>
          
          {currentSession && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">{currentSession.variance.found.length}</div>
                  <div className="text-sm text-success">{t('inventory.stockCount.variance.found')}</div>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <div className="text-2xl font-bold text-warning">{currentSession.variance.missing.length}</div>
                  <div className="text-sm text-warning">{t('inventory.stockCount.variance.missing')}</div>
                </div>
                <div className="text-center p-4 bg-danger/10 rounded-lg">
                  <div className="text-2xl font-bold text-danger">{currentSession.variance.extra.length}</div>
                  <div className="text-sm text-danger">{t('inventory.stockCount.variance.extra')}</div>
                </div>
              </div>

              {/* Variance Items */}
              <DataTable
                data={[...currentSession.variance.missing, ...currentSession.variance.extra]}
                columns={varianceColumns}
                title={t('inventory.stockCount.variance.items')}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={exportVariance}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('inventory.stockCount.actions.export')}
                </Button>
                <Button onClick={() => setShowVarianceDialog(false)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}