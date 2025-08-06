import React, { useState } from 'react';
import { Return } from '../types';
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
  returns: Return[];
  loading?: boolean;
  onReturnClick?: (returnItem: Return) => void;
}

type SortField = 'date' | 'status' | 'totalMap' | 'refundAmount';
type SortDirection = 'asc' | 'desc';

export function ReturnsTable({ returns, loading, onReturnClick }: ReturnsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
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
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'totalMap':
          aValue = a.totalMap;
          bValue = b.totalMap;
          break;
        case 'refundAmount':
          aValue = a.refundAmount;
          bValue = b.refundAmount;
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
              <TableHead>Return No.</TableHead>
              <TableHead>{renderSortableHeader('Date', 'date')}</TableHead>
              <TableHead>Number of Items</TableHead>
              <TableHead>{renderSortableHeader('Status', 'status')}</TableHead>
              <TableHead>{renderSortableHeader('Total MAP', 'totalMap')}</TableHead>
              <TableHead>{renderSortableHeader('Refund Amount', 'refundAmount')}</TableHead>
              <TableHead>Reason</TableHead>
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
                  <TableCell className="font-medium">
                    {returnItem.returnNumber}
                  </TableCell>
                  <TableCell>
                    {format(new Date(returnItem.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{returnItem.numberOfItems}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={returnItem.status} />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${returnItem.totalMap.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">${returnItem.refundAmount.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {returnItem.reason.length > 50 
                        ? `${returnItem.reason.substring(0, 50)}...` 
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