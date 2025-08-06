import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResetConfirmationProps {
  email: string;
}

export function ResetConfirmation({ email }: ResetConfirmationProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t('auth.reset.sent.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.reset.sent.description')}
          </p>
          <p className="text-sm font-medium text-foreground">
            {email}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p>{t('auth.reset.sent.checkInbox')}</p>
        <p>{t('auth.reset.sent.checkSpam')}</p>
      </div>

      <div className="pt-4">
        <Button variant="outline" asChild className="w-full">
          <Link to="/auth">
            {t('auth.reset.sent.backToLogin')}
          </Link>
        </Button>
      </div>
    </div>
  );
}