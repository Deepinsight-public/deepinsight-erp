import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Package, Truck, Store } from 'lucide-react';

export default function Search() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.search.title', 'Search') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.search.title', 'Search')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.search.description', 'Search for products, orders, and inventory across the warehouse')}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            {t('warehouse.search.globalSearch', 'Global Search')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder={t('warehouse.search.placeholder', 'Search by SKU, product name, order number...')}
              className="flex-1"
            />
            <Button>
              <SearchIcon className="mr-2 h-4 w-4" />
              {t('warehouse.search.button', 'Search')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium">{t('warehouse.search.products', 'Products')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('warehouse.search.productsDesc', 'Search inventory and products')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-medium">{t('warehouse.search.orders', 'Orders')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('warehouse.search.ordersDesc', 'Find purchase and transfer orders')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Store className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-medium">{t('warehouse.search.stores', 'Stores')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('warehouse.search.storesDesc', 'Search store information')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}