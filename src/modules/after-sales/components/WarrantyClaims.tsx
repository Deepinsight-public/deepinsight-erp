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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warranty Claims</h1>
          <p className="text-muted-foreground">
            Manage warranty claims and product returns under warranty
          </p>
        </div>
        <Button onClick={() => navigate('/store/after-sales/returns/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Warranty Claim
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Claims</CardTitle>
          <CardDescription>
            Search by claim number or fault description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search warranty claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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