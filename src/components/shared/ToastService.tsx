import { useToast } from '@/hooks/use-toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToastService() {
  const { toast } = useToast();

  const showSuccess = (title: string, description?: string, duration?: number) => {
    toast({
      title,
      description,
      duration,
      variant: 'default',
    });
  };

  const showError = (title: string, description?: string, duration?: number) => {
    toast({
      title,
      description,
      duration,
      variant: 'destructive',
    });
  };

  const showInfo = (title: string, description?: string, duration?: number) => {
    toast({
      title,
      description,
      duration,
      variant: 'default',
    });
  };

  const showWarning = (title: string, description?: string, duration?: number) => {
    toast({
      title,
      description,
      duration,
      variant: 'default',
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    toast,
  };
}

// Export a simple toast service for use outside of React components
export const toastService = {
  success: (title: string, description?: string) => {
    // This would need to be implemented with a global toast manager
    console.log('Success:', title, description);
  },
  error: (title: string, description?: string) => {
    console.error('Error:', title, description);
  },
  info: (title: string, description?: string) => {
    console.log('Info:', title, description);
  },
  warning: (title: string, description?: string) => {
    console.warn('Warning:', title, description);
  },
};