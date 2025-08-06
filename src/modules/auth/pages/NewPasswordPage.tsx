import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { NewPasswordForm } from '../components/NewPasswordForm';
import { verifyPasswordResetSession } from '../api/passwordReset';
import { useTranslation } from 'react-i18next';

export default function NewPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { isValid } = await verifyPasswordResetSession();
        if (isValid) {
          setIsValidSession(true);
        } else {
          setError(t('auth.reset.newPassword.invalidSession'));
        }
      } catch (err: any) {
        setError(err.message || t('auth.reset.newPassword.sessionError'));
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [t]);

  const handleSuccess = () => {
    navigate('/auth/reset/success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingOverlay />
      </div>
    );
  }

  if (!isValidSession || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                {error || t('auth.reset.newPassword.invalidSession')}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <NewPasswordForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}