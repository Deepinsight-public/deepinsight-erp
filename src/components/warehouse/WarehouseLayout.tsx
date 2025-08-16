import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { WarehouseHeader } from './WarehouseHeader';
import { WarehouseSidebar } from './WarehouseSidebar';
import { VersionFooter } from '@/components';
import { RightSidebar } from '@/components/shared/RightSidebar';

export function WarehouseLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Show right sidebar only on dashboard-like pages
  const showRightSidebar = location.pathname === '/warehouse/dashboard' || location.pathname === '/warehouse/sales-summary';

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <WarehouseSidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
          <WarehouseHeader />
          <div className="flex-1 flex min-h-0">
            <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-h-0">
              <Outlet />
            </main>
            {showRightSidebar && <RightSidebar />}
          </div>
          <VersionFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}