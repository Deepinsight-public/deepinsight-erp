import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';

import { getScrapHeaders } from '../api/scrap';
import type { ScrapHeader, ScrapFilters } from '../types/scrap';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  l1_approved: 'bg-yellow-100 text-yellow-800',
  final_approved: 'bg-green-100 text-green-800',
  posted: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export function ScrapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scrapItems, setScrapItems] = useState<ScrapHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ScrapFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadScrapItems = async () => {
    try {
      setLoading(true);
      const data = await getScrapHeaders(filters);
      console.log('Scrap data received:', data);
      startTransition(() => {
        setScrapItems(data);
      });
    } catch (error) {
      console.error('Error loading scrap items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScrapItems();
  }, [filters]);

  const handleSearch = () => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, search: searchTerm.trim() || undefined }));
    });
  };

  const handleFilterChange = (key: keyof ScrapFilters, value: string | undefined) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, [key]: value || undefined }));
    });
  };

  const handleRowClick = (scrap: ScrapHeader) => {
    navigate(`/store/scrap/${scrap.id}`);
  };

  const columns = [
    {
      key: 'scrapNo',
      title: t('scrap.page.columns.scrapNo'),
      render: (value: any, record: ScrapHeader) => {
        console.log('Rendering scrap number:', record.scrapNo, record);
        return <span className="font-medium font-mono">{record.scrapNo || 'N/A'}</span>;
      }
    },
    {
      key: 'createdAt',
      title: t('scrap.page.columns.date'),
      render: (value: any, record: ScrapHeader) => {
        console.log('Rendering date:', record.createdAt, record);
        if (!record.createdAt) return '-';
        try {
          const date = new Date(record.createdAt);
          if (isNaN(date.getTime())) return '-';
          return format(date, 'MMM dd, yyyy');
        } catch (error) {
          console.error('Error formatting date:', error);
          return '-';
        }
      }
    },
    {
      key: 'status',
      title: t('scrap.page.columns.status'),
      render: (value: any, record: ScrapHeader) => (
        <Badge 
          variant="secondary"
          className={STATUS_COLORS[record.status] || 'bg-gray-100 text-gray-800'}
        >
          {t(`scrapManagement.status.${record.status}`)}
        </Badge>
      )
    },
    {
      key: 'reason',
      title: t('scrap.page.columns.reason'),
      render: (value: any, record: ScrapHeader) => (
        <span className="capitalize">Coming soon</span>
      )
    },
    {
      key: 'totalQty',
      title: t('scrap.page.columns.totalQuantity'),
      render: (value: any, record: ScrapHeader) => (
        <span className="font-medium">{record.totalQty || 0}</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('scrapManagement.title')}</h1>
          <p className="text-muted-foreground">
            {t('scrap.page.description')}
          </p>
        </div>
        <Button onClick={() => navigate('/store/scrap/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('scrap.page.newRequest')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('scrapManagement.list.search')}</label>
              <div className="flex gap-2">
                <Input
                  placeholder={t('scrapManagement.list.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">{t('scrapManagement.list.status')}</label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('scrapManagement.list.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('scrapManagement.list.allStatus')}</SelectItem>
                  <SelectItem value="draft">{t('scrapManagement.status.draft')}</SelectItem>
                  <SelectItem value="submitted">{t('scrapManagement.status.submitted')}</SelectItem>
                  <SelectItem value="l1_approved">{t('scrapManagement.status.l1Approved')}</SelectItem>
                  <SelectItem value="final_approved">{t('scrapManagement.status.finalApproved')}</SelectItem>
                  <SelectItem value="posted">{t('scrapManagement.status.posted')}</SelectItem>
                  <SelectItem value="rejected">{t('scrapManagement.status.rejected')}</SelectItem>
                  <SelectItem value="cancelled">{t('scrapManagement.status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({});
                setSearchTerm('');
              }}
            >
              {t('scrapManagement.list.clear')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scrap Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={scrapItems}
            columns={columns}
            loading={loading}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}