import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, QrCode, Printer } from 'lucide-react';

export default function Barcodes() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ title: t('warehouse.barcodes.title', 'Barcodes') }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.barcodes.title', 'Barcode Management')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('warehouse.barcodes.description', 'Generate and manage barcodes for products and inventory')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">{t('warehouse.barcodes.generate', 'Generate Barcodes')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('warehouse.barcodes.generateDesc', 'Create barcodes for products')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium">{t('warehouse.barcodes.qr', 'QR Codes')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('warehouse.barcodes.qrDesc', 'Generate QR codes for tracking')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Printer className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium">{t('warehouse.barcodes.print', 'Print Labels')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('warehouse.barcodes.printDesc', 'Print barcode labels')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.barcodes.management', 'Barcode Management')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('warehouse.barcodes.placeholder', 'Barcode management functionality will be implemented here')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}