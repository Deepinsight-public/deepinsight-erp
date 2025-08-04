import { useTranslation } from 'react-i18next';

interface VersionFooterProps {
  version?: string;
  buildDate?: string;
  environment?: string;
  className?: string;
}

export function VersionFooter({
  version = '1.0.0',
  buildDate = new Date().toISOString().split('T')[0],
  environment = process.env.NODE_ENV || 'development',
  className = '',
}: VersionFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className={`mt-auto border-t bg-muted/30 px-6 py-3 ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>ERP Store Management System</span>
          <span>v{version}</span>
          {environment === 'development' && (
            <span className="px-2 py-0.5 bg-warning/20 text-warning rounded">
              DEV
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span>Build: {buildDate}</span>
          <span>© 2024 Store ERP</span>
        </div>
      </div>
    </footer>
  );
}