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
import { sendPasswordResetEmail } from '../api/passwordReset';
import { Mail } from 'lucide-react';

const requestSchema = z.object({
  email: z.string().email(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestResetFormProps {
  onSuccess: (email: string) => void;
}

export function RequestResetForm({ onSuccess }: RequestResetFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(data);
      onSuccess(data.email);
    } catch (err: any) {
      setError(err.message || t('auth.reset.request.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading && <LoadingOverlay />}
      
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t('auth.reset.request.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.reset.request.description')}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.reset.request.emailPlaceholder')}
            {...form.register('email')}
            disabled={loading}
            className="mt-1"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {t('auth.reset.request.emailRequired')}
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
          {loading ? t('auth.reset.request.sending') : t('auth.reset.request.send')}
        </Button>
      </form>
    </div>
  );
}