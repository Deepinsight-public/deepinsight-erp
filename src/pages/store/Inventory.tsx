import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, ArrowRight, ArrowLeft, ClipboardList } from 'lucide-react';
import { Breadcrumbs } from '@/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryDatabase } from '@/modules/inventory/components/InventoryDatabase';
import { TransferRecord } from '@/modules/inventory/components/TransferRecord';
import { ProductsList } from '@/modules/inventory/components/ProductsList';
import { useAuth } from '@/hooks/useAuth';

export default function Inventory() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('inventory') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('inventory.description')}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="inventory-db" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory-db">{t('inventory.tabs.inventory')}</TabsTrigger>
          <TabsTrigger value="transfers">{t('inventory.tabs.transfers')}</TabsTrigger>
          <TabsTrigger value="products">{t('inventory.tabs.products')}</TabsTrigger>
        </TabsList>

        {/* Inventory Database Tab */}
        <TabsContent value="inventory-db" className="mt-6 space-y-6">
          <InventoryDatabase storeId={profile?.store_id || 'store-1'} />
        </TabsContent>

        {/* Transfer Record Tab */}
        <TabsContent value="transfers" className="mt-6 space-y-6">
          <TransferRecord storeId={profile?.store_id || 'store-1'} />
        </TabsContent>

        {/* Products List Tab */}
        <TabsContent value="products" className="mt-6">
          <ProductsList storeId={profile?.store_id || 'store-1'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}