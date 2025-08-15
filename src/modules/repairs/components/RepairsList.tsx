import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StandardSearchBar } from '@/components/shared/StandardSearchBar';
import { useTranslation } from 'react-i18next';
import { RepairsTable } from './RepairsTable';
import { CreateRepairModal } from './CreateRepairModal';
import type { Repair, RepairFilters } from '../types';
import { getRepairs } from '../api/repairs';
import { useToastService } from '@/components/shared/ToastService';

export function RepairsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('processing');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { showError } = useToastService();

  const loadRepairs = async () => {
    try {
      setLoading(true);
      
      const filters: RepairFilters = {};
      if (searchQuery.trim()) {
        filters.search = searchQuery;
      }
      
      const data = await getRepairs(filters);
      setRepairs(data);
    } catch (error) {
      console.error('Error loading repairs:', error);
      showError(t('repairs.list.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const handleSearch = () => {
    // searchQuery is updated directly by StandardSearchBar
    loadRepairs();
  };

  const filteredRepairs = repairs.filter(repair => {
    // Filter by tab
    if (activeTab === 'processing') {
      return ['pending', 'in_progress'].includes(repair.status);
    }
    if (activeTab === 'warranty') {
      return repair.type === 'warranty';
    }
    return true;
  });

  const handleRepairClick = (repair: Repair) => {
    // Navigate to repair detail page
    navigate(`/store/repairs/${repair.id}`);
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    loadRepairs();
  };

  const breadcrumbs = [
    { title: t('repairs.list.title') }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('repairs.list.management')}</h1>
          <p className="text-muted-foreground">
            {t('repairs.list.description')}
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('repairs.list.createButton')}
        </Button>
      </div>

      <StandardSearchBar
        title={t('repairs.list.search.title')}
        searchValue={searchQuery}
        searchPlaceholder={t('repairs.list.search.placeholder')}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="processing">{t('repairs.list.tabs.processing')}</TabsTrigger>
          <TabsTrigger value="warranty">{t('repairs.list.tabs.warranty')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <RepairsTable
            repairs={filteredRepairs}
            loading={loading}
            onRepairClick={handleRepairClick}
          />
        </TabsContent>
      </Tabs>

      <CreateRepairModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}