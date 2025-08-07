import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { transfersApi } from '../api/transfers';
import type { TransferOrder } from '../types';

interface TransferManagementProps {
  storeId: string;
}

export function TransferManagement({ storeId }: TransferManagementProps) {
  const { t } = useTranslation();
  const [transfersOut, setTransfersOut] = useState<TransferOrder[]>([]);
  const [transfersIn, setTransfersIn] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, [storeId]);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const [outData, inData] = await Promise.all([
        transfersApi.getTransfers(storeId, 'transfer_out'),
        transfersApi.getTransfers(storeId, 'transfer_in'),
      ]);
      setTransfersOut(outData);
      setTransfersIn(inData);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      approved: 'default',
      shipped: 'default',
      received: 'default',
      canceled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const transferOutColumns = [
    {
      key: 'transferNumber',
      title: t('transferManagement.columns.transferNumber'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'toStoreId',
      title: t('transferManagement.columns.toStore'),
      render: (value: string) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      key: 'items',
      title: t('transferManagement.columns.items'),
      render: (value: any[]) => (
        <span>{t('transferManagement.itemsCount', { count: value?.length || 0 })}</span>
      ),
    },
    {
      key: 'status',
      title: t('transferManagement.columns.status'),
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'createdAt',
      title: t('transferManagement.columns.created'),
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const transferInColumns = [
    {
      key: 'transferNumber',
      title: t('transferManagement.columns.transferNumber'),
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'fromStoreId',
      title: t('transferManagement.columns.fromStore'),
      render: (value: string) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      key: 'items',
      title: t('transferManagement.columns.items'),
      render: (value: any[]) => (
        <span>{t('transferManagement.itemsCount', { count: value?.length || 0 })}</span>
      ),
    },
    {
      key: 'status',
      title: t('transferManagement.columns.status'),
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'shippedAt',
      title: t('transferManagement.columns.shipped'),
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  const handleCreateTransferOut = () => {
    console.log('Creating transfer out request...');
    // Would open transfer out creation dialog
  };

  const handleConfirmTransferIn = (transfer: TransferOrder) => {
    console.log('Confirming transfer in:', transfer.id);
    // Would open transfer in confirmation dialog
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          {t('transferManagement.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="out" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="out" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              {t('transferManagement.transferOut')}
            </TabsTrigger>
            <TabsTrigger value="in" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('transferManagement.transferIn')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="out" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t('transferManagement.outDescription')}
              </p>
              <Button onClick={handleCreateTransferOut}>
                <Plus className="h-4 w-4 mr-2" />
                {t('transferManagement.createTransferOut')}
              </Button>
            </div>

            <DataTable
              data={transfersOut}
              columns={transferOutColumns}
              loading={loading}
              onRowClick={(transfer) => console.log('View transfer:', transfer.id)}
            />
          </TabsContent>

          <TabsContent value="in" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t('transferManagement.inDescription')}
              </p>
            </div>

            <DataTable
              data={transfersIn}
              columns={transferInColumns}
              loading={loading}
              onRowClick={handleConfirmTransferIn}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}