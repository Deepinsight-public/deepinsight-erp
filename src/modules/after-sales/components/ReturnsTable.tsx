import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AfterSalesReturn } from '../types/newReturn';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface ReturnsTableProps {
  returns: AfterSalesReturn[];
  loading?: boolean;
  onReturnClick?: (returnItem: AfterSalesReturn) => void;
  onInvoiceClick?: (returnItem: AfterSalesReturn) => void;
}

type SortField = 'returnDate' | 'refundAmount' | 'reason' | 'status' | 'approvalMonth' | 'mapPrice' | 'totalAmountPaid';
type SortDirection = 'asc' | 'desc';

export function ReturnsTable({ returns, loading, onReturnClick, onInvoiceClick }: ReturnsTableProps) {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>('returnDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const renderSortableHeader = (title: string, field: SortField) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-2 text-left font-medium hover:text-primary"
    >
      {title}
      {getSortIcon(field)}
    </button>
  );

  const sortedReturns = React.useMemo(() => {
    return [...returns].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'returnDate':
          aValue = new Date(a.returnDate);
          bValue = new Date(b.returnDate);
          break;
        case 'refundAmount':
          aValue = a.refundAmount;
          bValue = b.refundAmount;
          break;
        case 'reason':
          aValue = a.reason;
          bValue = b.reason;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'approvalMonth':
          aValue = a.approvalMonth || '';
          bValue = b.approvalMonth || '';
          break;
        case 'mapPrice':
          aValue = a.mapPrice || 0;
          bValue = b.mapPrice || 0;
          break;
        case 'totalAmountPaid':
          aValue = a.totalAmountPaid || 0;
          bValue = b.totalAmountPaid || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [returns, sortField, sortDirection]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Wrap table to enable horizontal scrolling while keeping the rest of the layout responsive */}
        <div className="w-full overflow-x-auto">
          {/* min-w-full ensures the table keeps its natural width so the scrollbar appears only for the table */}
          <Table className="min-w-full">
            <TableHeader>
            <TableRow>
              <TableHead>{t('returns.table.returnId')}</TableHead>
              <TableHead>{renderSortableHeader(t('returns.table.returnDate'), 'returnDate')}</TableHead>
              <TableHead>{t('returns.table.returnType')}</TableHead>
              <TableHead>{t('returns.table.customer')}</TableHead>
              <TableHead>{t('returns.table.product')}</TableHead>
              <TableHead>{renderSortableHeader(t('returns.table.refundAmount'), 'refundAmount')}</TableHead>
              <TableHead>{renderSortableHeader(t('returns.table.reason'), 'reason')}</TableHead>
              <TableHead>{renderSortableHeader('Approval Month', 'approvalMonth')}</TableHead>
              <TableHead>{renderSortableHeader('Status', 'status')}</TableHead>
              <TableHead>Self Scraped</TableHead>
              <TableHead>{renderSortableHeader('MAP', 'mapPrice')}</TableHead>
              <TableHead>{renderSortableHeader('Total Paid', 'totalAmountPaid')}</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                  {t('returns.table.noReturns')}
                </TableCell>
              </TableRow>
            ) : (
              sortedReturns.map((returnItem) => (
                <TableRow 
                  key={returnItem.id}
                  className={onReturnClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onReturnClick?.(returnItem)}
                >
                  <TableCell className="font-medium font-mono text-sm">
                    {returnItem.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {format(new Date(returnItem.returnDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {returnItem.returnType === 'store' ? t('returns.types.store') : t('returns.types.warehouse')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {returnItem.returnType === 'store' && returnItem.customerFirst && returnItem.customerLast ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{returnItem.customerFirst} {returnItem.customerLast}</div>
                        <div className="text-xs text-muted-foreground">{returnItem.customerEmail}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t('returns.table.na')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {returnItem.product ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{returnItem.product.productName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{returnItem.product.sku}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t('returns.table.productNotFound')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">${returnItem.refundAmount.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {returnItem.reason.length > 30 
                        ? `${returnItem.reason.substring(0, 30)}...` 
                        : returnItem.reason}
                    </span>
                  </TableCell>
                  <TableCell>
                    {returnItem.approvalMonth ? (
                      <span className="text-sm">{returnItem.approvalMonth}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={returnItem.status || 'processing'} />
                  </TableCell>
                  <TableCell className="text-center">
                    {returnItem.selfScraped ? (
                      <span className="text-green-600 text-lg">✓</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {returnItem.mapPrice ? (
                      <span className="font-medium">${returnItem.mapPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {returnItem.totalAmountPaid ? (
                      <span className="font-medium text-blue-600">${returnItem.totalAmountPaid.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReturnClick?.(returnItem);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInvoiceClick?.(returnItem);
                        }}
                        title="View Invoice"
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}