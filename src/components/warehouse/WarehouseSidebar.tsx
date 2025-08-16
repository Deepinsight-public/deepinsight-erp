import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
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
  Home,
  ClipboardList,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'dashboard',
    url: '/warehouse/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'salesSummary',
    url: '/warehouse/sales-summary',
    icon: TrendingUp,
  },
  {
    title: 'storeManagement',
    url: '/warehouse/store-management',
    icon: Store,
  },
  {
    title: 'storePO',
    url: '/warehouse/store-po',
    icon: ShoppingCart,
  },
  {
    title: 'wholesale',
    url: '/warehouse/wholesale',
    icon: Truck,
  },
  {
    title: 'loadList',
    url: '/warehouse/load-list',
    icon: ClipboardList,
  },
  {
    title: 'search',
    url: '/warehouse/search',
    icon: Search,
  },
  {
    title: 'inventory',
    url: '/warehouse/inventory',
    icon: Package,
  },
  {
    title: 'barcodes',
    url: '/warehouse/barcodes',
    icon: BarChart3,
  },
  {
    title: 'afterSales',
    url: '/warehouse/after-sales',
    icon: RefreshCw,
  },
];

export function WarehouseSidebar() {
  const { t } = useTranslation();
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (url: string) => {
    if (url === '/warehouse/dashboard') {
      return currentPath === url;
    }
    return currentPath.startsWith(url);
  };

  return (
    <Sidebar className={open ? 'w-64' : 'w-16'}>
      <SidebarContent>
        {/* Logo/Brand Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            {open && (
              <div>
                <h2 className="text-lg font-semibold">ERP Warehouse</h2>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={open ? 'px-4' : 'sr-only'}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && (
                          <span className="font-medium">
                            {t(`warehouse.nav.${item.title}`)}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}