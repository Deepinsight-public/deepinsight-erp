import React, { useState, useEffect } from 'react';
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
      title: 'Count Number',
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(value)}
          <span className="capitalize">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'scheduledDate',
      title: 'Scheduled',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'items',
      title: 'Items',
      render: (value: any[]) => (
        <span>{value?.length || 0} items</span>
      ),
    },
    {
      key: 'adjustments',
      title: 'Adjustments',
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
      title: 'SKU',
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity',
      render: (value: number) => (
        <span>{value}</span>
      ),
    },
    {
      key: 'scanMethod',
      title: 'Method',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">{value}</Badge>
      ),
    },
    {
      key: 'scannedAt',
      title: 'Scanned At',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'uploaded',
      title: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Uploaded' : 'Pending'}
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
          Inventory Count Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="counts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="counts">Count History</TabsTrigger>
            <TabsTrigger value="scanning" className="relative">
              Scanning
              {pendingItems > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs">{pendingItems}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="counts" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Manage inventory counts and cycle counting operations
              </p>
              <Button onClick={handleCreateCount}>
                <Plus className="h-4 w-4 mr-2" />
                New Count
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
                  <h3 className="font-medium">RFID/Barcode Scanning</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan items for inventory counting (offline capable)
                  </p>
                </div>
                <div className="flex gap-2">
                  {pendingItems > 0 && (
                    <Button variant="outline" onClick={handleUploadQueue}>
                      Upload Queue ({pendingItems})
                    </Button>
                  )}
                  <Button 
                    onClick={handleStartScanning}
                    disabled={isScanning}
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    {isScanning ? 'Scanning...' : 'Start Scanning'}
                  </Button>
                </div>
              </div>

              {scanQueue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <DataTable
                data={scanQueue}
                columns={queueColumns}
                title="Scan Queue"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}