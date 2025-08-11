import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Search, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventorySearchAdvanced } from '@/modules/inventory/components/InventorySearchAdvanced';
import { TransferManagementAdvanced } from '@/modules/inventory/components/TransferManagementAdvanced';
import { PurchaseManagement } from '@/modules/inventory/components/PurchaseManagement';
import { StockCountManagement } from '@/modules/inventory/components/StockCountManagement';
import { useAuth } from '@/hooks/useAuth';

export default function Inventory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const storeId = user?.user_metadata?.store_id || '';

  if (!storeId) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">{t('inventory.noStoreAccess')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('inventory.title') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('inventory.description')}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('inventory.settings')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('inventory.tabs.search')}
          </TabsTrigger>
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('inventory.tabs.purchase')}
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('inventory.tabs.transfers')}
          </TabsTrigger>
          <TabsTrigger value="counts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('inventory.tabs.counts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <InventorySearchAdvanced 
            storeId={storeId}
            onExport={() => console.log('Exporting inventory...')}
          />
        </TabsContent>

        <TabsContent value="purchase" className="mt-6">
          <PurchaseManagement storeId={storeId} />
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          <TransferManagementAdvanced storeId={storeId} />
        </TabsContent>

        <TabsContent value="counts" className="mt-6">
          <StockCountManagement storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}