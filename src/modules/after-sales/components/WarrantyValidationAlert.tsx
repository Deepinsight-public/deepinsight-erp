import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WarrantyValidationResult } from '../types/warrantyValidation';

interface WarrantyValidationAlertProps {
  result: WarrantyValidationResult;
  className?: string;
}

export const WarrantyValidationAlert = ({ result, className }: WarrantyValidationAlertProps) => {
  const { t } = useTranslation();

  const getAlertVariant = () => {
    switch (result.status) {
      case 'valid':
        return 'default'; // Using default for success-like state
      case 'expired':
        return 'destructive';
      case 'not_found':
      case 'invalid_product':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (result.status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'not_found':
      case 'invalid_product':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (result.status) {
      case 'valid':
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">{t('afterSales.warranty.status.valid')}</Badge>;
      case 'expired':
        return <Badge variant="destructive">{t('afterSales.warranty.status.expired')}</Badge>;
      case 'not_found':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">{t('afterSales.warranty.status.notFound')}</Badge>;
      case 'invalid_product':
        return <Badge variant="destructive">{t('afterSales.warranty.status.invalidProduct')}</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Alert variant={getAlertVariant()} className={className}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertDescription className="font-medium">
              {t('afterSales.warranty.validation.title')}
            </AlertDescription>
            {getStatusBadge()}
          </div>
          
          <AlertDescription>
            {result.errorMessage || t(`afterSales.warranty.messages.${result.status}`)}
          </AlertDescription>

          {result.isValid && result.expiryDate && (
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">{t('afterSales.warranty.expiryDate')}: </span>
                <span className="font-medium">{formatDate(result.expiryDate)}</span>
              </div>
              {result.remainingDays !== undefined && (
                <div>
                  <span className="text-muted-foreground">{t('afterSales.warranty.remainingDays')}: </span>
                  <span className="font-medium">{result.remainingDays} {t('common.days')}</span>
                </div>
              )}
              {result.salesOrderId && (
                <div>
                  <span className="text-muted-foreground">{t('afterSales.warranty.salesOrder')}: </span>
                  <span className="font-medium">{result.salesOrderId.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};