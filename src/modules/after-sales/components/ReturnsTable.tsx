import React, { useState } from 'react';
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
import { ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface ReturnsTableProps {
  returns: AfterSalesReturn[];
  loading?: boolean;
  onReturnClick?: (returnItem: AfterSalesReturn) => void;
}

type SortField = 'returnDate' | 'refundAmount' | 'reason';
type SortDirection = 'asc' | 'desc';

export function ReturnsTable({ returns, loading, onReturnClick }: ReturnsTableProps) {
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
        <CardHeader>
          <CardTitle>Returns</CardTitle>
        </CardHeader>
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
      <CardHeader>
        <CardTitle>Returns</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return ID</TableHead>
              <TableHead>{renderSortableHeader('Return Date', 'returnDate')}</TableHead>
              <TableHead>Return Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>{renderSortableHeader('Refund Amount', 'refundAmount')}</TableHead>
              <TableHead>{renderSortableHeader('Reason', 'reason')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No returns found
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
                      {returnItem.returnType === 'store' ? 'Store Return' : 'Warehouse Return'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {returnItem.returnType === 'store' && returnItem.customerFirst && returnItem.customerLast ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{returnItem.customerFirst} {returnItem.customerLast}</div>
                        <div className="text-xs text-muted-foreground">{returnItem.customerEmail}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {returnItem.product ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{returnItem.product.productName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{returnItem.product.sku}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Product not found</span>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}