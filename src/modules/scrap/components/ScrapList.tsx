import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StandardSearchBar } from '@/components/shared/StandardSearchBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { getScrapHeaders } from '../api/scrap';
import type { ScrapHeader, ScrapFilters, ScrapStatus } from '../types/scrap';

const STATUS_COLORS: Record<ScrapStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  l1_approved: 'bg-yellow-100 text-yellow-800',
  final_approved: 'bg-green-100 text-green-800',
  posted: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export function ScrapList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scraps, setScraps] = useState<ScrapHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ScrapFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const loadScraps = async () => {
    try {
      setLoading(true);
      const data = await getScrapHeaders(filters);
      setScraps(data);
    } catch (error) {
      console.error('Error loading scraps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScraps();
  }, [filters]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery.trim() || undefined }));
  };

  const handleFilterChange = (key: keyof ScrapFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleRowClick = (scrap: ScrapHeader) => {
    navigate(`/store/scrap/${scrap.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('scrap.title')}</h1>
          <p className="text-muted-foreground">
            {t('scrap.description')}
          </p>
        </div>
        <Button onClick={() => navigate('/store/scrap/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('scrap.newRequest')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <StandardSearchBar
            title={t('scrap.list.search')}
            searchValue={searchQuery}
            searchPlaceholder={t('scrap.list.searchPlaceholder')}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            filters={[
              {
                key: 'status',
                label: t('scrap.list.status'),
                placeholder: t('scrap.list.allStatus'),
                type: 'select',
                options: [
                  { value: 'all', label: t('scrap.list.allStatus') },
                  { value: 'draft', label: t('scrap.status.draft') },
                  { value: 'submitted', label: t('scrap.status.submitted') },
                  { value: 'l1_approved', label: t('scrap.status.l1Approved') },
                  { value: 'final_approved', label: t('scrap.status.finalApproved') },
                  { value: 'posted', label: t('scrap.status.posted') },
                  { value: 'rejected', label: t('scrap.status.rejected') },
                  { value: 'cancelled', label: t('scrap.status.cancelled') },
                ],
                value: filters.status || 'all',
                onChange: (value) => handleFilterChange('status', value === 'all' ? undefined : value as ScrapStatus),
              },
            ]}
            onClear={() => {
              setFilters({});
              setSearchQuery('');
            }}
            showClear={true}
          />
        </CardContent>
      </Card>

      {/* Scrap List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('scrap.list.count', { count: scraps.length })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>{t('scrap.list.scrapNo')}</TableHead>
                  <TableHead>{t('scrap.list.status')}</TableHead>
                  <TableHead>{t('scrap.list.totalQty')}</TableHead>
                  <TableHead>{t('scrap.list.totalValue')}</TableHead>
                  <TableHead>{t('scrap.list.createdDate')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {scraps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('scrap.list.noRequests')}
                  </TableCell>
                </TableRow>
              ) : (
                scraps.map((scrap) => (
                  <TableRow
                    key={scrap.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(scrap)}
                  >
                    <TableCell className="font-medium font-mono">
                      {scrap.scrapNo}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={STATUS_COLORS[scrap.status as ScrapStatus]}
                      >
                        {t(`scrap.status.${scrap.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{scrap.totalQty}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${scrap.totalValue?.toFixed(2) || '0.00'}</span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(scrap.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}