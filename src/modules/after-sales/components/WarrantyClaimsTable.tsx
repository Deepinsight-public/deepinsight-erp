import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components';
import { WarrantyHeader } from '../types/warranty';

interface WarrantyClaimsTableProps {
  claims: WarrantyHeader[];
  loading: boolean;
  onClaimClick: (claimId: string) => void;
}

export function WarrantyClaimsTable({ claims, loading, onClaimClick }: WarrantyClaimsTableProps) {
  const { t } = useTranslation();
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
    return t(`warranty.status.${status}`, status);
  };

  const columns = [
    {
      key: 'claimNo',
      title: t('warranty.table.claimNumber'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'status',
      title: t('warranty.table.status'),
      render: (value: string) => (
        <Badge variant={getStatusVariant(value)}>
          {getStatusLabel(value)}
        </Badge>
      )
    },
    {
      key: 'faultDesc',
      title: t('warranty.table.faultDescription'),
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'invoiceDate',
      title: t('warranty.table.invoiceDate'),
      render: (value: string | null) => value ? format(new Date(value), 'MMM dd, yyyy') : '—'
    },
    {
      key: 'warrantyExpiry',
      title: t('warranty.table.warrantyExpiry'),
      render: (value: string | null) => value ? format(new Date(value), 'MMM dd, yyyy') : '—'
    },
    {
      key: 'createdAt',
      title: t('warranty.table.created'),
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'actions',
      title: t('warranty.table.actions'),
      render: (_: any, claim: WarrantyHeader) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onClaimClick(claim.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <DataTable
      data={claims}
      columns={columns}
      loading={loading}
      onRowClick={(claim) => onClaimClick(claim.id)}
    />
  );
}