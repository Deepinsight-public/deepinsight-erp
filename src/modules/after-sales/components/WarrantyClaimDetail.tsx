import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        title: t('error'),
        description: t('warranty.detail.loadError'),
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
        title: t('success'),
        description: t('warranty.detail.submitSuccess'),
      });
      // Reload claim to get updated status
      await loadClaim(claim.id);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('warranty.detail.submitError'),
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
        return t('warranty.status.draft');
      case 'submitted':
        return t('warranty.status.submitted');
      case 'tech_reviewed':
        return t('warranty.status.techReviewed');
      case 'approved':
        return t('warranty.status.approved');
      case 'resolved':
        return t('warranty.status.resolved');
      case 'closed':
        return t('warranty.status.closed');
      case 'rejected':
        return t('warranty.status.rejected');
      case 'cancelled':
        return t('warranty.status.cancelled');
      default:
        return status;
    }
  };

  const linesColumns = [
    {
      key: 'productId',
      title: t('warranty.detail.items.productId'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'serialNo',
      title: t('warranty.detail.items.serialNo'),
      render: (value: string | null) => value || '—'
    },
    {
      key: 'qty',
      title: t('warranty.detail.items.qty')
    },
    {
      key: 'uom',
      title: t('warranty.detail.items.uom')
    },
    {
      key: 'warrantyType',
      title: t('warranty.detail.items.warrantyType'),
      render: (value: string) => (
        <Badge variant={value === 'std' ? 'default' : 'secondary'}>
          {value === 'std' ? t('warranty.type.std') : t('warranty.type.ext')}
        </Badge>
      )
    }
  ];

  const auditColumns = [
    {
      key: 'action',
      title: t('warranty.detail.audit.action'),
      render: (value: string) => (
        <Badge variant="outline">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'actorId',
      title: t('warranty.detail.audit.actor'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'comment',
      title: t('warranty.detail.audit.comment'),
      render: (value: string | null) => value || '—'
    },
    {
      key: 'createdAt',
      title: t('warranty.detail.audit.date'),
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
          <h1 className="text-2xl font-bold">{t('warranty.detail.notFound')}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {t('warranty.detail.notFoundDesc')}
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
            <p className="text-muted-foreground">{t('warranty.detail.title')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={getStatusVariant(claim.status)}>
            {getStatusLabel(claim.status)}
          </Badge>
          {claim.status === 'draft' && (
            <Button onClick={handleSubmit} disabled={submitting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitting ? t('warranty.detail.submitting') : t('warranty.detail.submitClaim')}
            </Button>
          )}
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('warranty.detail.overview')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.claimNo')}</p>
              <p className="font-mono">{claim.claimNo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.status')}</p>
              <Badge variant={getStatusVariant(claim.status)}>
                {getStatusLabel(claim.status)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.createdDate')}</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.invoiceDate')}</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {claim.invoiceDate ? format(new Date(claim.invoiceDate), 'MMM dd, yyyy') : '—'}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.faultDesc')}</p>
            <p className="text-sm leading-relaxed">{claim.faultDesc}</p>
          </div>

          {claim.warrantyExpiry && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.warrantyExpiry')}</p>
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
          <TabsTrigger value="lines">{t('warranty.detail.tabs.lines')}</TabsTrigger>
          {claim.tech && <TabsTrigger value="technical">{t('warranty.detail.tabs.technical')}</TabsTrigger>}
          {claim.resolution && <TabsTrigger value="resolution">{t('warranty.detail.tabs.resolution')}</TabsTrigger>}
          <TabsTrigger value="audit">{t('warranty.detail.tabs.audit')}</TabsTrigger>
        </TabsList>

        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('warranty.detail.items.title')}
              </CardTitle>
              <CardDescription>
                {t('warranty.detail.items.desc')}
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
                  {t('warranty.detail.tech.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.tech.diagnosis')}</p>
                    <p className="text-sm">{claim.tech.diagnosis}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.tech.solution')}</p>
                    <Badge variant="outline">
                      {claim.tech.solution.charAt(0).toUpperCase() + claim.tech.solution.slice(1)}
                    </Badge>
                  </div>
                  {claim.tech.estCost && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.tech.estCost')}</p>
                      <p className="text-sm font-mono">${claim.tech.estCost.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.tech.inspectedAt')}</p>
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
                  {t('warranty.detail.resolution.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.resolution.action')}</p>
                    <Badge variant="default">
                      {claim.resolution.action.charAt(0).toUpperCase() + claim.resolution.action.slice(1)}
                    </Badge>
                  </div>
                  {claim.resolution.creditAmount && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.resolution.creditAmount')}</p>
                      <p className="text-sm font-mono">${claim.resolution.creditAmount.toFixed(2)}</p>
                    </div>
                  )}
                  {claim.resolution.vendorRma && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.resolution.vendorRma')}</p>
                      <p className="text-sm font-mono">{claim.resolution.vendorRma}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('warranty.detail.resolution.approvedAt')}</p>
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
                {t('warranty.detail.audit.title')}
              </CardTitle>
              <CardDescription>
                {t('warranty.detail.audit.desc')}
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