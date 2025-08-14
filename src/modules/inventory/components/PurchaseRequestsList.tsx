import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, StatusBadge } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { fetchPurchaseRequests, fetchPurchaseQueue } from '../api/purchase-requests';
import { PurchaseRequest, PurchaseQueue, QueuePosition } from '../types/purchase-requests';

export function PurchaseRequestsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [queueData, setQueueData] = useState<PurchaseQueue | null>(null);
  const [loading, setLoading] = useState(true);

  // Use actual store ID from auth context  
  const currentStoreId = profile?.store_id || '';
  const currentWarehouseId = '11111111-1111-1111-1111-111111111111';
  
  const isYourTurn = queueData?.currentStoreId === currentStoreId;
  const currentTurnStore = queueData?.queue.find(q => q.storeId === queueData?.currentStoreId);

  const loadData = useCallback(async () => {
    if (!currentStoreId) return;
    
    setLoading(true);
    try {
      const [requestsData, queueResult] = await Promise.all([
        fetchPurchaseRequests(currentStoreId),
        fetchPurchaseQueue(currentWarehouseId, currentStoreId)
      ]);

      setRequests(requestsData);
      setQueueData(queueResult);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('purchaseRequests.loadError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentStoreId, currentWarehouseId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for updates when not your turn
  useEffect(() => {
    if (!isYourTurn && queueData) {
      const interval = setInterval(() => {
        loadData();
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isYourTurn, queueData, loadData]);

  const getStatusIcon = (status: PurchaseRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: PurchaseRequest['status']) => {
    switch (status) {
      case 'pending':
        return t('purchaseRequests.status.pending');
      case 'approved':
        return t('purchaseRequests.status.approved');
      case 'rejected':
        return t('purchaseRequests.status.rejected');
      case 'completed':
        return t('purchaseRequests.status.completed');
      default:
        return t('purchaseRequests.status.unknown');
    }
  };

  const columns = [
    {
      key: 'id',
      title: t('purchaseRequests.columns.requestNo'),
      render: (value: string) => (
        <span className="font-medium text-primary">{value.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'items',
      title: t('purchaseRequests.columns.items'),
      render: (items: any[]) => (
        <div className="flex flex-col gap-1">
          {items.slice(0, 2).map((item, index) => (
            <span key={index} className="text-sm">
              {item.sku}: {item.qty}
            </span>
          ))}
          {items.length > 2 && (
            <span className="text-sm text-muted-foreground">
              +{items.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: t('purchaseRequests.columns.status'),
      render: (value: PurchaseRequest['status']) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <Badge variant={value === 'approved' ? 'default' : 'secondary'}>
            {getStatusLabel(value)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: t('purchaseRequests.columns.date'),
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('purchaseRequests.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('purchaseRequests.description')}
          </p>
        </div>
      </div>

      {/* Queue Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Purchase Queue (Round {queueData?.roundNumber || 'N/A'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Turn</p>
              <p className="font-medium">
                {isYourTurn ? 'Your Store' : currentTurnStore?.storeName || 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Position</p>
              <div className="flex items-center gap-2">
                <Badge variant={isYourTurn ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                  #{queueData?.yourPosition || 'N/A'}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stores</p>
              <p className="font-medium">{queueData?.queue.length || 0}</p>
            </div>
          </div>

          {/* Queue List */}
          {queueData?.queue && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-muted-foreground">Queue Order:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {queueData.queue.map((store) => (
                  <div 
                    key={store.storeId}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      store.storeId === queueData.currentStoreId 
                        ? 'bg-green-50 border-green-200' 
                        : store.storeId === currentStoreId
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Badge variant="outline" className="min-w-[2rem] justify-center">
                      {store.position}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{store.storeName}</p>
                      {store.storeId === queueData.currentStoreId && (
                        <p className="text-xs text-green-600">Current Turn</p>
                      )}
                      {store.storeId === currentStoreId && store.storeId !== queueData.currentStoreId && (
                        <p className="text-xs text-blue-600">Your Store</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isYourTurn ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">{t('purchaseRequests.queue.yourTurn')}</p>
                  <p className="text-sm text-green-600">
                    {t('purchaseRequests.queue.yourTurnDesc')}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/store/purchase-requests/new')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('purchaseRequests.create')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {t('purchaseRequests.queue.waiting')}
                  </p>
                  <p className="text-sm text-yellow-600">
                    {t('purchaseRequests.queue.waitingDesc', { position: queueData?.yourPosition })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Purchase Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Your Purchase Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={requests}
            columns={columns}
            loading={loading}
            title="Purchase Requests History"
          />
        </CardContent>
      </Card>
    </div>
  );
}