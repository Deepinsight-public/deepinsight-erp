import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, Search, Plus, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InventorySearchAdvanced } from '@/modules/inventory/components/InventorySearchAdvanced';
import { TransferManagementAdvanced } from '@/modules/inventory/components/TransferManagementAdvanced';
import { PurchaseManagement } from '@/modules/inventory/components/PurchaseManagement';
import { StockCountManagement } from '@/modules/inventory/components/StockCountManagement';
import { StoreSelectionOverlay } from '@/modules/inventory/components/StoreSelectionOverlay';
import { useStoreId } from '@/modules/inventory/hooks/useStoreId';

export default function Inventory() {
  const { t } = useTranslation();
  const { storeId, isLoading, error, needsStoreSelection, isHQUser } = useStoreId();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Use selectedStoreId if available, otherwise use detected storeId
  const activeStoreId = selectedStoreId || storeId;

  const handleStoreSelect = (newStoreId: string) => {
    setSelectedStoreId(newStoreId);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('inventory.loading')}</p>
        </div>
      </div>
    );
  }

  // Show store selection overlay for non-HQ users without store
  if (needsStoreSelection) {
    return (
      <>
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
            </div>
          </div>
          
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              {t('inventory.storeSelection.required')}
            </AlertDescription>
          </Alert>
        </div>
        <StoreSelectionOverlay onStoreSelect={handleStoreSelect} />
      </>
    );
  }

  // Show error state if there's an error and user is not HQ
  if (error && !isHQUser) {
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
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('inventory.error.storeAccess')}: {error}
          </AlertDescription>
        </Alert>
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
            storeId={activeStoreId}
            onExport={() => console.log('Exporting inventory...')}
          />
        </TabsContent>

        <TabsContent value="purchase" className="mt-6">
          <PurchaseManagement storeId={activeStoreId} />
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          <TransferManagementAdvanced storeId={activeStoreId} />
        </TabsContent>

        <TabsContent value="counts" className="mt-6">
          <StockCountManagement storeId={activeStoreId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}