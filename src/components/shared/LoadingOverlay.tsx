import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  className?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingOverlay({ 
  className, 
  text, 
  size = 'md' 
}: LoadingOverlayProps) {
  const { t } = useTranslation();
  const defaultText = text || t('message.loading');
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn(
      'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
      className
    )}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        {defaultText && (
          <p className="text-sm text-muted-foreground">{defaultText}</p>
        )}
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}