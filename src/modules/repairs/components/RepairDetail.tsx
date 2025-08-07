import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, DollarSign, Package, User, FileText, Tag, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { useToastService } from '@/components/shared/ToastService';
import { getRepairById, updateRepairStatus } from '../api/repairDetails';
import { Repair } from '../types';

export function RepairDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { showSuccess, showError } = useToastService();

  useEffect(() => {
    const loadRepair = async () => {
      if (!id) {
        navigate('/store/repairs');
        return;
      }

      try {
        setLoading(true);
        const repairData = await getRepairById(id);
        setRepair(repairData);
      } catch (error) {
        console.error('Error loading repair:', error);
        showError('Failed to load repair details');
        navigate('/store/repairs');
      } finally {
        setLoading(false);
      }
    };

    loadRepair();
  }, [id, navigate, showError]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!repair?.id) return;

    try {
      setUpdating(true);
      await updateRepairStatus(repair.id, newStatus);
      setRepair(prev => prev ? { ...prev, status: newStatus as any } : null);
      showSuccess('Repair status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update repair status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeVariant = (type: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (type) {
      case 'warranty': return 'default';
      case 'paid': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!repair) {
    return <div>Repair not found</div>;
  }

  const isWarrantyActive = repair.warrantyStatus === 'active' && 
    repair.warrantyExpiresAt && 
    new Date(repair.warrantyExpiresAt) > new Date();

  return (
    <div className="space-y-6">
      {updating && <LoadingOverlay />}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repair #{repair.repairId}</h1>
          <p className="text-muted-foreground">
            Created on {format(new Date(repair.createdAt), 'PPP')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={repair.status} variant={getStatusVariant(repair.status)} />
          <Badge variant={getTypeVariant(repair.type)}>
            {repair.type.charAt(0).toUpperCase() + repair.type.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                  <p className="font-medium">{repair.product.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="font-medium">{repair.product.sku}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {repair.customerName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{repair.customerName}</p>
                {repair.salesOrderId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Order ID: {repair.salesOrderId}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Repair Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{repair.description}</p>
            </CardContent>
          </Card>

          {/* Warranty Information */}
          {repair.warrantyStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Warranty Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={isWarrantyActive ? 'default' : 'destructive'}>
                    {isWarrantyActive ? 'Active' : 'Expired'}
                  </Badge>
                </div>
                {repair.warrantyExpiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="text-sm">
                      {format(new Date(repair.warrantyExpiresAt), 'PPP')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {repair.status === 'pending' && (
                <Button 
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="w-full"
                  disabled={updating}
                >
                  Start Repair
                </Button>
              )}
              {repair.status === 'in_progress' && (
                <Button 
                  onClick={() => handleStatusUpdate('completed')}
                  className="w-full"
                  disabled={updating}
                >
                  Mark Complete
                </Button>
              )}
              {repair.status !== 'cancelled' && repair.status !== 'completed' && (
                <Button 
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="w-full"
                  disabled={updating}
                >
                  Cancel Repair
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Repair Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {repair.cost && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Cost</span>
                  </div>
                  <span className="font-medium">${repair.cost.toFixed(2)}</span>
                </div>
              )}
              
              {repair.estimatedCompletion && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Est. Completion</span>
                  </div>
                  <span className="text-sm">
                    {format(new Date(repair.estimatedCompletion), 'PPP')}
                  </span>
                </div>
              )}

              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created</span>
                </div>
                <span className="text-sm">
                  {format(new Date(repair.createdAt), 'PPP')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Updated</span>
                </div>
                <span className="text-sm">
                  {format(new Date(repair.updatedAt), 'PPP')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}