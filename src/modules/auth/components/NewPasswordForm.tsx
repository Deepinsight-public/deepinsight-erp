import { useState } from 'react';
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

const passwordSchema = z.object({
  password: z.string().min(6, t('auth.validation.passwordMinLength')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.validation.passwordsDoNotMatch'),
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface NewPasswordFormProps {
  onSuccess: () => void;
}

export function NewPasswordForm({ onSuccess }: NewPasswordFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || t('auth.reset.newPassword.error'));
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
          {t('auth.reset.newPassword.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.reset.newPassword.description')}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="password">{t('auth.reset.newPassword.password')}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t('auth.reset.newPassword.passwordPlaceholder')}
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
          <Label htmlFor="confirmPassword">{t('auth.reset.newPassword.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t('auth.reset.newPassword.confirmPasswordPlaceholder')}
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
          {loading ? t('auth.reset.newPassword.saving') : t('auth.reset.newPassword.save')}
        </Button>
      </form>
    </div>
  );
}