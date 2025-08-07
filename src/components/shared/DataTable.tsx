import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  loading?: boolean;
  onRowClick?: (record: T) => void;
  pagination?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  loading,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  const { t } = useTranslation();
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
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)} 
                  style={{ width: column.width }}
                >
                  {column.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="text-center py-8 text-muted-foreground"
                >
                  {t('message.noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((record, index) => (
                <TableRow 
                  key={index}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((column) => {
                    const value = record[column.key as keyof T];
                    return (
                      <TableCell key={String(column.key)}>
                        {column.render ? column.render(value, record) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pagination && (
          <div className="p-4 border-t">
            {pagination}
          </div>
        )}
      </CardContent>
    </Card>
  );
}