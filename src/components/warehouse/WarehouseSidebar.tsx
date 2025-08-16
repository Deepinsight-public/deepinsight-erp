import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  TrendingUp,
  Store,
  ShoppingCart,
  Truck,
  Search,
  Package,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export function WarehouseSidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const menuItems = [
    {
      title: t('warehouse.nav.dashboard', 'Dashboard'),
      icon: LayoutDashboard,
      path: '/warehouse/dashboard',
    },
    {
      title: t('warehouse.nav.salesSummary', 'Sales Summary'),
      icon: TrendingUp,
      path: '/warehouse/sales-summary',
    },
    {
      title: t('warehouse.nav.storeManagement', 'Store Management'),
      icon: Store,
      path: '/warehouse/store-management',
    },
    {
      title: t('warehouse.nav.storePO', 'Store PO'),
      icon: ShoppingCart,
      path: '/warehouse/store-po',
    },
    {
      title: t('warehouse.nav.wholesale', 'Wholesale'),
      icon: Truck,
      path: '/warehouse/wholesale',
    },
    {
      title: t('warehouse.nav.loadList', 'Load List'),
      icon: Package,
      path: '/warehouse/load-list',
    },
    {
      title: t('warehouse.nav.search', 'Search'),
      icon: Search,
      path: '/warehouse/search',
    },
    {
      title: t('warehouse.nav.inventory', 'Inventory'),
      icon: Package,
      path: '/warehouse/inventory',
    },
    {
      title: t('warehouse.nav.barcodes', 'Barcodes'),
      icon: BarChart3,
      path: '/warehouse/barcodes',
    },
    {
      title: t('warehouse.nav.afterSales', 'After Sales'),
      icon: RefreshCw,
      path: '/warehouse/after-sales',
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('warehouse.nav.main', 'Warehouse')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}