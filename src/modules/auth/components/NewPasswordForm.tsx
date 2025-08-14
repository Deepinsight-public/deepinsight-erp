import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { updatePassword } from '../api/passwordReset';
import { KeyRound } from 'lucide-react';

type PasswordFormData = {
  password: string;
  confirmPassword: string;
};

interface NewPasswordFormProps {
  onSuccess: () => void;
}

export function NewPasswordForm({ onSuccess }: NewPasswordFormProps) {
  const { t, ready } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordSchema = useMemo(() => {
    if (!t || !ready) {
      // Fallback schema without translations
      return z.object({
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
    
    return z.object({
      password: z.string().min(6, t('auth.validation.passwordMinLength')),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
  }, [t, ready]);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      await updatePassword(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || (t ? t('auth.reset.newPassword.error') : 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading && <LoadingOverlay />}
      
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t ? t('auth.reset.newPassword.title') : 'Set New Password'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t ? t('auth.reset.newPassword.description') : 'Choose a strong password for your account.'}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="password">{t ? t('auth.reset.newPassword.password') : 'New Password'}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t ? t('auth.reset.newPassword.passwordPlaceholder') : 'Enter new password'}
            {...form.register('password')}
            disabled={loading}
            className="mt-1"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t ? t('auth.reset.newPassword.confirmPassword') : 'Confirm New Password'}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t ? t('auth.reset.newPassword.confirmPasswordPlaceholder') : 'Confirm new password'}
            {...form.register('confirmPassword')}
            disabled={loading}
            className="mt-1"
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (t ? t('auth.reset.newPassword.saving') : 'Saving...') : (t ? t('auth.reset.newPassword.save') : 'Save New Password')}
        </Button>
      </form>
    </div>
  );
}