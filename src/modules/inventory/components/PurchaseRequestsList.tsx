import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, StatusBadge } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { fetchPurchaseRequests, fetchPurchaseTurn, canStoreOrder } from '../api/purchase-requests';
import { PurchaseRequest, PurchaseTurn } from '../types/purchase-requests';

export function PurchaseRequestsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseTurn, setPurchaseTurn] = useState<PurchaseTurn | null>(null);
  const [canOrder, setCanOrder] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock store ID - in real app this would come from auth context
  const currentStoreId = '22222222-2222-2222-2222-222222222222';
  const currentWarehouseId = '11111111-1111-1111-1111-111111111111';

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, turnData, canOrderResult] = await Promise.all([
        fetchPurchaseRequests(currentStoreId),
        fetchPurchaseTurn(currentWarehouseId),
        canStoreOrder(currentStoreId, currentWarehouseId)
      ]);

      setRequests(requestsData);
      setPurchaseTurn(turnData);
      setCanOrder(canOrderResult);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load purchase requests',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const columns = [
    {
      key: 'id',
      title: 'Request ID',
      render: (value: string) => (
        <span className="font-medium text-primary">{value.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'items',
      title: 'Items',
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
      title: 'Status',
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
      title: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Requests (抢单)</h1>
          <p className="text-muted-foreground mt-2">
            Round-robin inventory allocation system for warehouse distribution.
          </p>
        </div>
      </div>

      {/* Turn Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Turn Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Turn</p>
              <p className="font-medium">
                {purchaseTurn?.currentStoreId === currentStoreId 
                  ? 'Your Store' 
                  : `Store ${purchaseTurn?.currentStoreId?.slice(0, 8) || 'N/A'}`
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Round Number</p>
              <p className="font-medium">{purchaseTurn?.roundNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Status</p>
              <div className="flex items-center gap-2">
                {canOrder ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Can Order</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">Waiting Turn</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {canOrder && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">It's your turn to order!</p>
                  <p className="text-sm text-green-600">
                    You must place an order now to maintain the round-robin sequence.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/store/purchase-requests/new')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
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