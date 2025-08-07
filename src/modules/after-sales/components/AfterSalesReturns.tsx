import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
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
    // For now, just reload all returns. Can add filtering later if needed
    loadReturns();
  };

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
          {/* Search Bar for Return Processing */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('afterSales.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              {t('afterSales.search.button')}
            </Button>
          </div>
          
          <div className="flex justify-end mb-4">
            <Button onClick={() => navigate('/store/after-sales/returns/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('afterSales.createReturn')}
            </Button>
          </div>
          <ReturnsTable
            returns={returns}
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