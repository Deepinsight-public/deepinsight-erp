import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StandardSearchBar } from '@/components/shared/StandardSearchBar';
import { useTranslation } from 'react-i18next';
import { RepairsTable } from './RepairsTable';
import type { Repair } from '../types';
import { getRepairs } from '../api/repairs';
import { useToastService } from '@/components/shared/ToastService';

export function RepairsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // For display only
  const [activeTab, setActiveTab] = useState('all');
  const { showError } = useToastService();

  const loadRepairs = async () => {
    try {
      setLoading(true);
      const data = await getRepairs();
      setRepairs(data);
    } catch (error) {
      console.error('Error loading repairs:', error);
      showError(t('repairs.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const handleSearch = () => {
    setSearchQuery(searchTerm); // Apply the search term
    loadRepairs();
  };

  const filteredRepairs = repairs.filter(repair => {
    // Apply search filter only after search button is clicked
    if (searchQuery && searchQuery.trim() !== '' && !repair.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return repair.status === 'pending';
    if (activeTab === 'in_progress') return repair.status === 'in_progress';
    if (activeTab === 'completed') return repair.status === 'completed';
    return true;
  });

  const handleRepairClick = (repair: Repair) => {
    // Navigate to repair detail page
    navigate(`/store/repairs/${repair.id}`);
  };

  const breadcrumbs = [
    { title: t('repairs') }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('repairs.title')}</h1>
          <p className="text-muted-foreground">
            {t('repairs.description')}
          </p>
        </div>
        <Button onClick={() => navigate('/store/repairs/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('repairs.create')}
        </Button>
      </div>

      <StandardSearchBar
        title={t('repairs.search.title') || 'Search Repairs'}
        searchValue={searchTerm}
        searchPlaceholder={t('repairs.searchPlaceholder')}
        onSearchChange={(value) => {
          setSearchTerm(value);
          if (value === '') {
            setSearchQuery(''); // Clear search immediately when input is cleared
          }
        }}
        onSearch={handleSearch}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">{t('repairs.tabs.all')}</TabsTrigger>
          <TabsTrigger value="pending">{t('repairs.tabs.pending')}</TabsTrigger>
          <TabsTrigger value="in_progress">{t('repairs.tabs.inProgress')}</TabsTrigger>
          <TabsTrigger value="completed">{t('repairs.tabs.completed')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <RepairsTable
            repairs={filteredRepairs}
            loading={loading}
            onRepairClick={handleRepairClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}