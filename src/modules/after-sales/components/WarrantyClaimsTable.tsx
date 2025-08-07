import React from 'react';
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

  const columns = [
    {
      key: 'claimNo',
      title: 'Claim Number',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusVariant(value)}>
          {getStatusLabel(value)}
        </Badge>
      )
    },
    {
      key: 'faultDesc',
      title: 'Fault Description',
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'invoiceDate',
      title: 'Invoice Date',
      render: (value: string | null) => value ? format(new Date(value), 'MMM dd, yyyy') : '—'
    },
    {
      key: 'warrantyExpiry',
      title: 'Warranty Expiry',
      render: (value: string | null) => value ? format(new Date(value), 'MMM dd, yyyy') : '—'
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'actions',
      title: 'Actions',
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