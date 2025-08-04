import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ShoppingCart,
  FileText,
  Package,
  Users,
  Wrench,
  Search,
  RotateCcw,
  ArrowUp,
  Trash2,
  Settings,
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
    url: '/store/dashboard',
    icon: BarChart3,
  },
  {
    title: 'salesOrders',
    url: '/store/sales-orders',
    icon: ShoppingCart,
  },
  {
    title: 'purchaseRequests',
    url: '/store/purchase-requests',
    icon: FileText,
  },
  {
    title: 'inventory',
    url: '/store/inventory',
    icon: Package,
  },
  {
    title: 'crm',
    url: '/store/customers',
    icon: Users,
  },
  {
    title: 'afterSales',
    url: '/store/after-sales/returns',
    icon: ClipboardList,
  },
  {
    title: 'repairs',
    url: '/store/repairs',
    icon: Wrench,
  },
  {
    title: 'orderSearch',
    url: '/store/orders/search',
    icon: Search,
  },
  {
    title: 'customerReturns',
    url: '/store/customer-returns',
    icon: RotateCcw,
  },
  {
    title: 'returnsToHQ',
    url: '/store/hq-returns',
    icon: ArrowUp,
  },
  {
    title: 'scrap',
    url: '/store/scrap',
    icon: Trash2,
  },
  {
    title: 'settings',
    url: '/store/settings',
    icon: Settings,
  },
];

export function StoreSidebar() {
  const { t } = useTranslation();
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (url: string) => {
    if (url === '/store/dashboard') {
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
                <h2 className="text-lg font-semibold">ERP Store</h2>
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
                            {t(item.title)}
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