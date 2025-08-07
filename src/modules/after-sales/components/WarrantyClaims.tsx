import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToastService } from '@/components';
import { WarrantyClaimsTable } from './WarrantyClaimsTable';
import { getWarrantyClaims } from '../api/warranty';
import { WarrantyHeader } from '../types/warranty';

export function WarrantyClaims() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToastService();
  const [claims, setClaims] = useState<WarrantyHeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');


  const loadClaims = async () => {
    try {
      setLoading(true);
      const data = await getWarrantyClaims({ 
        status: activeTab === 'all' ? undefined : activeTab 
      });
      setClaims(data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('warranty.loadError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [activeTab]);

  const handleSearch = () => {
    loadClaims();
  };

  const handleClaimClick = (claimId: string) => {
    navigate(`/store/after-sales/warranty/${claimId}`);
  };

  const filteredClaims = claims.filter(claim =>
    claim.claimNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.faultDesc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Bar for Warranty Claims */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('warranty.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          {t('warranty.search')}
        </Button>
      </div>
      
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate('/store/after-sales/warranty/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('warranty.newClaim')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('warranty.tabs.all')}</TabsTrigger>
          <TabsTrigger value="draft">{t('warranty.tabs.draft')}</TabsTrigger>
          <TabsTrigger value="submitted">{t('warranty.tabs.submitted')}</TabsTrigger>
          <TabsTrigger value="tech_reviewed">{t('warranty.tabs.techReviewed')}</TabsTrigger>
          <TabsTrigger value="approved">{t('warranty.tabs.approved')}</TabsTrigger>
          <TabsTrigger value="resolved">{t('warranty.tabs.resolved')}</TabsTrigger>
          <TabsTrigger value="closed">{t('warranty.tabs.closed')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <WarrantyClaimsTable
            claims={filteredClaims}
            loading={loading}
            onClaimClick={handleClaimClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}