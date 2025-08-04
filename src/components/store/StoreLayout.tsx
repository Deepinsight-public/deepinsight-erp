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
        <div className="flex-1 flex flex-col">
          <StoreHeader />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
          <VersionFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}