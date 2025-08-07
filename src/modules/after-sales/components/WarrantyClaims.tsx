import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        title: 'Error',
        description: 'Failed to load warranty claims',
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
    navigate(`/store/after-sales/returns/${claimId}`);
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
            placeholder="Search warranty claims..."
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
      
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate('/store/after-sales/returns/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Warranty Claim
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Claims</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="tech_reviewed">Tech Reviewed</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
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