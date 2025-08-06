import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all');
  const { showError } = useToastService();

  const loadRepairs = async () => {
    try {
      setLoading(true);
      const data = await getRepairs();
      setRepairs(data);
    } catch (error) {
      console.error('Error loading repairs:', error);
      showError('Failed to load repairs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const handleSearch = () => {
    // For now, just reload all repairs. Can add filtering later if needed
    loadRepairs();
  };

  const handleRepairClick = (repair: Repair) => {
    // Navigate to repair detail page
    navigate(`/store/repairs/${repair.id}`);
  };

  const breadcrumbs = [
    { title: 'Repairs' }
  ];

  const filteredRepairs = repairs.filter(repair => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return repair.status === 'pending';
    if (activeTab === 'in_progress') return repair.status === 'in_progress';
    if (activeTab === 'completed') return repair.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repairs Management</h1>
          <p className="text-muted-foreground">
            Manage product repairs and service orders
          </p>
        </div>
        <Button onClick={() => navigate('/store/repairs/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Repair
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Repair ID, Description, or Status..."
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
          <TabsTrigger value="all">All Repairs</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
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