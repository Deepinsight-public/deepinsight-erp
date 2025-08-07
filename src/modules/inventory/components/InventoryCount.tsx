import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanLine, ClipboardList, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { countsApi } from '../api/counts';
import type { InventoryCount, ScanQueueItem } from '../types';

interface InventoryCountProps {
  storeId: string;
}

export function InventoryCount({ storeId }: InventoryCountProps) {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [scanQueue, setScanQueue] = useState<ScanQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadCounts();
    loadScanQueue();
  }, [storeId]);

  const loadCounts = async () => {
    setLoading(true);
    try {
      const data = await countsApi.getCounts(storeId);
      setCounts(data);
    } catch (error) {
      console.error('Failed to load counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScanQueue = () => {
    const queueData = localStorage.getItem('scanQueue');
    if (queueData) {
      setScanQueue(JSON.parse(queueData));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      in_progress: 'default',
      completed: 'default',
      reviewed: 'default',
      approved: 'default',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <ClipboardList className="h-4 w-4" />;
      case 'partial':
        return <CheckCircle className="h-4 w-4" />;
      case 'cycle':
        return <ScanLine className="h-4 w-4" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  const countColumns = [
    {
      key: 'countNumber',
      title: t('inventoryCount.columns.countNumber'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'type',
      title: t('inventoryCount.columns.type'),
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(value)}
          <span className="capitalize">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('inventoryCount.columns.status'),
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'scheduledDate',
      title: t('inventoryCount.columns.scheduled'),
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'items',
      title: t('inventoryCount.columns.items'),
      render: (value: any[]) => (
        <span>{value?.length || 0} items</span>
      ),
    },
    {
      key: 'adjustments',
      title: t('inventoryCount.columns.adjustments'),
      render: (value: any[]) => {
        const pendingCount = value?.filter(adj => adj.status === 'pending').length || 0;
        return pendingCount > 0 ? (
          <div className="flex items-center gap-1 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>{pendingCount}</span>
          </div>
        ) : (
          <span>0</span>
        );
      },
    },
  ];

  const queueColumns = [
    {
      key: 'sku',
      title: t('inventoryCount.columns.sku'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'quantity',
      title: t('inventoryCount.columns.quantity'),
      render: (value: number) => (
        <span>{value}</span>
      ),
    },
    {
      key: 'scanMethod',
      title: t('inventoryCount.columns.method'),
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">{value}</Badge>
      ),
    },
    {
      key: 'scannedAt',
      title: t('inventoryCount.columns.scannedAt'),
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'uploaded',
      title: t('inventoryCount.columns.statusCol'),
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? t('inventoryCount.uploaded') : t('inventoryCount.pending')}
        </Badge>
      ),
    },
  ];

  const handleCreateCount = () => {
    console.log('Creating new inventory count...');
    // Would open count creation dialog
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    console.log('Starting barcode/RFID scanning...');
    // Would integrate with scanner hardware
  };

  const handleUploadQueue = async () => {
    try {
      await countsApi.uploadScanQueue();
      loadScanQueue();
      console.log('Scan queue uploaded successfully');
    } catch (error) {
      console.error('Failed to upload scan queue:', error);
    }
  };

  const pendingItems = scanQueue.filter(item => !item.uploaded).length;
  const uploadProgress = scanQueue.length > 0 ? ((scanQueue.length - pendingItems) / scanQueue.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          {t('inventoryCount.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="counts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="counts">{t('inventoryCount.countHistory')}</TabsTrigger>
            <TabsTrigger value="scanning" className="relative">
              {t('inventoryCount.scanning')}
              {pendingItems > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs">{pendingItems}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="counts" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t('inventoryCount.description')}
              </p>
              <Button onClick={handleCreateCount}>
                <Plus className="h-4 w-4 mr-2" />
                {t('inventoryCount.newCount')}
              </Button>
            </div>

            <DataTable
              data={counts}
              columns={countColumns}
              loading={loading}
              onRowClick={(count) => console.log('View count:', count.id)}
            />
          </TabsContent>

          <TabsContent value="scanning" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{t('inventoryCount.scanningTitle')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('inventoryCount.scanningDescription')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {pendingItems > 0 && (
                    <Button variant="outline" onClick={handleUploadQueue}>
                      {t('inventoryCount.uploadQueue', { count: pendingItems })}
                    </Button>
                  )}
                  <Button 
                    onClick={handleStartScanning}
                    disabled={isScanning}
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    {isScanning ? t('inventoryCount.scanningActive') : t('inventoryCount.startScanning')}
                  </Button>
                </div>
              </div>

              {scanQueue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('inventoryCount.uploadProgress')}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <DataTable
                data={scanQueue}
                columns={queueColumns}
                title={t('inventoryCount.scanQueue')}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}