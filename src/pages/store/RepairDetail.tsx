import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { getRepair } from '@/modules/repairs/api/repairs';
import { Repair } from '@/modules/repairs/types';
import { ArrowLeft, Calendar, DollarSign, User, Package, FileText, Clock, Shield, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function RepairDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = [
    { title: 'Repairs', href: '/store/repairs' },
    { title: repair ? `Repair #${repair.repairId}` : 'Repair Details' }
  ];

  useEffect(() => {
    const loadRepair = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const repairData = await getRepair(id);
        setRepair(repairData);
      } catch (err) {
        console.error('Failed to load repair:', err);
        setError(err instanceof Error ? err.message : 'Failed to load repair');
      } finally {
        setLoading(false);
      }
    };

    loadRepair();
  }, [id]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'warranty': return 'default';
      case 'paid': return 'secondary';
      case 'goodwill': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Parse description to extract clean description (without metadata tags)
  const getCleanDescription = (description: string) => {
    if (!description) return 'No description provided';
    
    // Remove metadata tags like [CUSTOM_PRODUCT]=..., [MODEL]=..., etc.
    return description
      .replace(/\[CUSTOM_PRODUCT\]=[^\n]+\n?/g, '')
      .replace(/\[MODEL\]=[^\n]+\n?/g, '')
      .replace(/\[PARTS_REQUIRED\]=[^\n]+\n?/g, '')
      .trim() || 'No description provided';
  };

  if (loading) return <LoadingOverlay />;

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/store/repairs')}
              >
                Back to Repairs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>Repair not found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/store/repairs')}
              >
                Back to Repairs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/store/repairs')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Repair #{repair.repairId}</h1>
            <p className="text-muted-foreground">
              Created on {formatDate(repair.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant={getStatusBadgeVariant(repair.status)}>
            {repair.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant={getTypeBadgeVariant(repair.type)}>
            {repair.type.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Product Name</label>
              <p className="text-base">{repair.product.name}</p>
            </div>
            
            {repair.product.sku !== 'CUSTOM' && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="text-base">{repair.product.sku}</p>
                </div>
                {repair.product.brand && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="text-base">{repair.product.brand}</p>
                  </div>
                )}
              </>
            )}
            
            {repair.product.model && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Model</label>
                <p className="text-base">{repair.product.model}</p>
              </div>
            )}
            
            {repair.partsRequired && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Parts Required</label>
                <p className="text-base">{repair.partsRequired}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {repair.customerName ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-base">{repair.customerName}</p>
                </div>
                {repair.customerEmail && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {repair.customerEmail}
                    </p>
                  </div>
                )}
                {repair.customerPhone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-base flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {repair.customerPhone}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No customer information available</p>
            )}
          </CardContent>
        </Card>

        {/* Repair Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Repair Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-base whitespace-pre-wrap">{getCleanDescription(repair.description)}</p>
            </div>
            
            {repair.cost && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost</label>
                <p className="text-base flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatCurrency(repair.cost)}
                </p>
              </div>
            )}
            
            {repair.estimatedCompletion && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estimated Completion</label>
                <p className="text-base flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatDate(repair.estimatedCompletion)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warranty Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Warranty Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Warranty Status</label>
              <p className="text-base capitalize">{repair.warrantyStatus || 'Unknown'}</p>
            </div>
            
            {repair.warrantyExpiresAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Warranty Expires</label>
                <p className="text-base flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(repair.warrantyExpiresAt)}
                </p>
              </div>
            )}
            
            {repair.salesOrderId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Related Sales Order</label>
                <p className="text-base">{repair.salesOrderId}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <div>
                <p className="font-medium">Repair Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(repair.createdAt)}</p>
              </div>
            </div>
            
            {repair.updatedAt !== repair.createdAt && (
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-secondary rounded-full" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">{formatDate(repair.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}