import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Package, User, FileText, Settings, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components';
import { useToastService } from '@/components';
import { getWarrantyClaim, submitWarrantyClaim } from '../api/warranty';
import { WarrantyClaim } from '../types/warranty';

export function WarrantyClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToastService();
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadClaim(id);
    }
  }, [id]);

  const loadClaim = async (claimId: string) => {
    try {
      setLoading(true);
      const data = await getWarrantyClaim(claimId);
      setClaim(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load warranty claim details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!claim?.id) return;
    
    try {
      setSubmitting(true);
      await submitWarrantyClaim(claim.id);
      toast({
        title: 'Success',
        description: 'Warranty claim submitted successfully',
      });
      // Reload claim to get updated status
      await loadClaim(claim.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit warranty claim',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'submitted':
        return 'outline';
      case 'tech_reviewed':
        return 'outline';
      case 'approved':
        return 'default';
      case 'resolved':
      case 'closed':
        return 'default';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'tech_reviewed':
        return 'Tech Reviewed';
      case 'approved':
        return 'Approved';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const linesColumns = [
    {
      key: 'productId',
      title: 'Product ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'serialNo',
      title: 'Serial Number',
      render: (value: string | null) => value || '—'
    },
    {
      key: 'qty',
      title: 'Quantity'
    },
    {
      key: 'uom',
      title: 'UOM'
    },
    {
      key: 'warrantyType',
      title: 'Warranty Type',
      render: (value: string) => (
        <Badge variant={value === 'std' ? 'default' : 'secondary'}>
          {value === 'std' ? 'Standard' : 'Extended'}
        </Badge>
      )
    }
  ];

  const auditColumns = [
    {
      key: 'action',
      title: 'Action',
      render: (value: string) => (
        <Badge variant="outline">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'actorId',
      title: 'Actor',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'comment',
      title: 'Comment',
      render: (value: string | null) => value || '—'
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy HH:mm')
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Warranty Claim Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              The warranty claim you're looking for could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{claim.claimNo}</h1>
            <p className="text-muted-foreground">Warranty Claim Details</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={getStatusVariant(claim.status)}>
            {getStatusLabel(claim.status)}
          </Badge>
          {claim.status === 'draft' && (
            <Button onClick={handleSubmit} disabled={submitting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          )}
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Claim Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Claim Number</p>
              <p className="font-mono">{claim.claimNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(claim.status)}>
                {getStatusLabel(claim.status)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created Date</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {claim.invoiceDate ? format(new Date(claim.invoiceDate), 'MMM dd, yyyy') : '—'}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Fault Description</p>
            <p className="text-sm leading-relaxed">{claim.faultDesc}</p>
          </div>

          {claim.warrantyExpiry && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Warranty Expiry</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(claim.warrantyExpiry), 'MMM dd, yyyy')}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="lines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lines">Claim Items</TabsTrigger>
          {claim.tech && <TabsTrigger value="technical">Technical Review</TabsTrigger>}
          {claim.resolution && <TabsTrigger value="resolution">Resolution</TabsTrigger>}
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Warranty Claim Items
              </CardTitle>
              <CardDescription>
                Products included in this warranty claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={claim.lines || []}
                columns={linesColumns}
                loading={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {claim.tech && (
          <TabsContent value="technical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Technical Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                    <p className="text-sm">{claim.tech.diagnosis}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Recommended Solution</p>
                    <Badge variant="outline">
                      {claim.tech.solution.charAt(0).toUpperCase() + claim.tech.solution.slice(1)}
                    </Badge>
                  </div>
                  {claim.tech.estCost && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                      <p className="text-sm font-mono">${claim.tech.estCost.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Inspected Date</p>
                    <p className="text-sm">{format(new Date(claim.tech.inspectedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {claim.resolution && (
          <TabsContent value="resolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Resolution Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Action Taken</p>
                    <Badge variant="default">
                      {claim.resolution.action.charAt(0).toUpperCase() + claim.resolution.action.slice(1)}
                    </Badge>
                  </div>
                  {claim.resolution.creditAmount && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Credit Amount</p>
                      <p className="text-sm font-mono">${claim.resolution.creditAmount.toFixed(2)}</p>
                    </div>
                  )}
                  {claim.resolution.vendorRma && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Vendor RMA</p>
                      <p className="text-sm font-mono">{claim.resolution.vendorRma}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Approved Date</p>
                    <p className="text-sm">{format(new Date(claim.resolution.approvedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                History of actions performed on this warranty claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={claim.audit || []}
                columns={auditColumns}
                loading={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}