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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  TrendingUp,
  Store,
  ShoppingCart,
  Plus,
  Truck,
  Search,
  Package,
  ArrowDown,
  ArrowUp,
  BarChart3,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export function WarehouseSidebar() {
  const { t } = useTranslation();
  const { collapsed } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
  ];

  const storeManagementItems = [
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
      title: t('warehouse.nav.newStorePO', 'New Store PO'),
      icon: Plus,
      path: '/warehouse/store-po/new',
    },
  ];

  const wholesaleItems = [
    {
      title: t('warehouse.nav.wholesale', 'Wholesale'),
      icon: Truck,
      path: '/warehouse/wholesale',
    },
    {
      title: t('warehouse.nav.newWholesale', 'New Wholesale'),
      icon: Plus,
      path: '/warehouse/wholesale/new',
    },
  ];

  const operationsItems = [
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
  ];

  const inventoryItems = [
    {
      title: t('warehouse.nav.inventory', 'Inventory'),
      icon: Package,
      path: '/warehouse/inventory',
    },
    {
      title: t('warehouse.nav.transferIn', 'Transfer In'),
      icon: ArrowDown,
      path: '/warehouse/inventory/transfer-in',
    },
    {
      title: t('warehouse.nav.transferOut', 'Transfer Out'),
      icon: ArrowUp,
      path: '/warehouse/inventory/transfer-out',
    },
  ];

  const otherItems = [
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
    {
      title: t('warehouse.nav.scrap', 'Scrap'),
      icon: Trash2,
      path: '/warehouse/after-sales/scrap',
    },
    {
      title: t('warehouse.nav.returns', 'Returns'),
      icon: RefreshCw,
      path: '/warehouse/after-sales/return',
    },
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible>
      <SidebarContent>
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('warehouse.nav.main', 'Main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Store Management */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('warehouse.nav.storeManagementGroup', 'Store Management')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {storeManagementItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Wholesale */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('warehouse.nav.wholesaleGroup', 'Wholesale')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {wholesaleItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('warehouse.nav.operations', 'Operations')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Inventory */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('warehouse.nav.inventoryGroup', 'Inventory')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Other */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('warehouse.nav.other', 'Other')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
