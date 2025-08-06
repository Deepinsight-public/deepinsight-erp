import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import type { Repair } from '../types';

interface RepairsTableProps {
  repairs: Repair[];
  loading?: boolean;
  onRepairClick?: (repair: Repair) => void;
}

type SortField = 'date' | 'cost' | 'type';
type SortDirection = 'asc' | 'desc';

export function RepairsTable({ repairs, loading, onRepairClick }: RepairsTableProps) {
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
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium text-left justify-start"
      onClick={() => handleSort(field)}
    >
      {title}
      {getSortIcon(field)}
    </Button>
  );

  const sortedRepairs = React.useMemo(() => {
    return [...repairs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'cost':
          aValue = a.cost || 0;
          bValue = b.cost || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [repairs, sortField, sortDirection]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repair ID</TableHead>
              <TableHead>{renderSortableHeader('Date', 'date')}</TableHead>
              <TableHead>{renderSortableHeader('Type', 'type')}</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>{renderSortableHeader('Cost', 'cost')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRepairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No repairs found
                </TableCell>
              </TableRow>
            ) : (
              sortedRepairs.map((repair) => (
                <TableRow 
                  key={repair.id}
                  className={onRepairClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRepairClick?.(repair)}
                >
                  <TableCell className="font-medium">{repair.repairId}</TableCell>
                  <TableCell>
                    {format(new Date(repair.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={repair.type} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{repair.product.name}</div>
                      <div className="text-sm text-muted-foreground">{repair.product.sku}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={repair.status.replace('_', ' ') as any} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={repair.description}>
                      {repair.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {repair.cost ? `$${repair.cost.toFixed(2)}` : '-'}
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