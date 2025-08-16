import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewStorePO() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[
          { title: t('warehouse.po.title', 'Store PO') },
          { title: t('warehouse.po.new', 'New PO') }
        ]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.po.new', 'New Store Purchase Order')}</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/warehouse/store-po">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back', 'Back')}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.po.createNew', 'Create New Purchase Order')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('warehouse.po.formPlaceholder', 'PO creation form will be implemented here')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}