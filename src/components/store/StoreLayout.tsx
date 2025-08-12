import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { StoreHeader } from './StoreHeader';
import { StoreSidebar } from './StoreSidebar';
import { VersionFooter } from '@/components';

export function StoreLayout() {
  const { t } = useTranslation();

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <StoreSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <StoreHeader />
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-h-0">
            <Outlet />
          </main>
          <VersionFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}