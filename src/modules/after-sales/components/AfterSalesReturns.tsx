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
import { Return, ReturnFilters } from '../types';
import { getReturns } from '../api/returns';
import { useToastService } from '@/components/shared/ToastService';

export function AfterSalesReturns() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('processing');
  const { showError } = useToastService();

  const loadReturns = async (filters?: ReturnFilters) => {
    try {
      setLoading(true);
      const data = await getReturns(filters);
      setReturns(data);
    } catch (error) {
      console.error('Error loading returns:', error);
      showError('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleSearch = () => {
    const filters: ReturnFilters = {};
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    loadReturns(filters);
  };

  const handleReturnClick = (returnItem: Return) => {
    // Navigate to return detail or open modal
    console.log('Return clicked:', returnItem);
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
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">After-Sales Returns</h1>
          <p className="text-muted-foreground">
            Manage product returns and warranty claims
          </p>
        </div>
        <Button onClick={() => navigate('/store/after-sales/returns/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Return
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Return No., Reason, or Status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          Search
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="processing">Return Processing</TabsTrigger>
          <TabsTrigger value="warranty">Warranty Validation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="processing" className="space-y-4">
          <ReturnsTable
            returns={returns}
            loading={loading}
            onReturnClick={handleReturnClick}
          />
        </TabsContent>
        
        <TabsContent value="warranty" className="space-y-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Warranty Validation</h3>
            <p className="text-muted-foreground">
              Warranty validation functionality coming soon
            </p>
          </div>
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