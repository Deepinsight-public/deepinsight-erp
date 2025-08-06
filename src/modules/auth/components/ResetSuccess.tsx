import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ResetSuccess() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t('auth.reset.success.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.reset.success.description')}
          </p>
        </div>
      </div>

      <div className="pt-4">
        <Button asChild className="w-full">
          <Link to="/auth">
            {t('auth.reset.success.backToLogin')}
          </Link>
        </Button>
      </div>
    </div>
  );
}