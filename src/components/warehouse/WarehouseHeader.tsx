import { useTranslation } from 'react-i18next';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationDropdown } from '@/components/shared/NotificationDropdown';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Warehouse } from 'lucide-react';

export function WarehouseHeader() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Warehouse className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">{t('warehouse.title', 'Warehouse Management')}</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationDropdown>
          <span />
        </NotificationDropdown>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            WH
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}