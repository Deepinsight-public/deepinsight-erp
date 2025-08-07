import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StandardSearchBar } from '@/components/shared/StandardSearchBar';
import { useTranslation } from 'react-i18next';
import { ReturnsTable } from './ReturnsTable';
import { CreateReturnDialog } from './CreateReturnDialog';
import { WarrantyClaims } from './WarrantyClaims';
import type { AfterSalesReturn } from '../types/newReturn';
import { getAllAfterSalesReturns } from '../api/newReturns';
import { useToastService } from '@/components/shared/ToastService';

export function AfterSalesReturns() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [returns, setReturns] = useState<AfterSalesReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('processing');
  const { showError } = useToastService();

  const loadReturns = async () => {
    try {
      setLoading(true);
      const data = await getAllAfterSalesReturns();
      setReturns(data);
    } catch (error) {
      console.error('Error loading returns:', error);
      showError(t('afterSales.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleSearch = () => {
    // searchQuery is updated directly by StandardSearchBar
  };

  // Filter returns based on search query
  const filteredReturns = returns.filter(returnItem => {
    if (!searchQuery || searchQuery.trim() === '') return true; // Show all data when empty
    const searchLower = searchQuery.toLowerCase();
    
    // Search across multiple fields
    return (
      returnItem.id.toLowerCase().includes(searchLower) ||
      returnItem.reason.toLowerCase().includes(searchLower) ||
      (returnItem.product?.productName && returnItem.product.productName.toLowerCase().includes(searchLower)) ||
      (returnItem.product?.sku && returnItem.product.sku.toLowerCase().includes(searchLower)) ||
      (returnItem.customerFirst && `${returnItem.customerFirst} ${returnItem.customerLast}`.toLowerCase().includes(searchLower)) ||
      (returnItem.customerEmail && returnItem.customerEmail.toLowerCase().includes(searchLower))
    );
  });

  const handleReturnClick = (returnItem: AfterSalesReturn) => {
    // Navigate to return detail page
    navigate(`/store/after-sales/returns/${returnItem.id}`);
  };

  const handleCreateSuccess = () => {
    loadReturns();
  };

  const breadcrumbs = [
    { title: t('afterSales') }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div>
        <h1 className="text-3xl font-bold">{t('afterSales.title')}</h1>
        <p className="text-muted-foreground">
          {t('afterSales.description')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="processing">{t('afterSales.tabs.processing')}</TabsTrigger>
          <TabsTrigger value="warranty">{t('afterSales.tabs.warranty')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="processing" className="space-y-4">
          <StandardSearchBar
            title={t('afterSales.search.title') || 'Search Returns'}
            searchValue={searchQuery}
            searchPlaceholder={t('afterSales.search.placeholder')}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
          />
          
          <div className="flex justify-end mb-4">
            <Button onClick={() => navigate('/store/after-sales/returns/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('afterSales.createReturn')}
            </Button>
          </div>
          <ReturnsTable
            returns={filteredReturns}
            loading={loading}
            onReturnClick={handleReturnClick}
          />
        </TabsContent>
        
        <TabsContent value="warranty" className="space-y-4">
          <WarrantyClaims />
        </TabsContent>
      </Tabs>

      <CreateReturnDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}