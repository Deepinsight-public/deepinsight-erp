import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, Globe, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from '@/components/shared/NotificationDropdown';
import { EditProfileDialog } from '@/modules/profile/components/EditProfileDialog';
import { supabase } from '@/integrations/supabase/client';

export function StoreHeader() {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [storeName, setStoreName] = useState('测试门店');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Fetch store name based on user's store_id
  useEffect(() => {
    const fetchStoreName = async () => {
      if (profile?.store_id) {
        try {
          const { data, error } = await supabase
            .from('stores')
            .select('store_name')
            .eq('id', profile.store_id)
            .single();

          if (data && !error) {
            setStoreName(data.store_name);
          }
        } catch (error) {
          console.error('Error fetching store name:', error);
        }
      }
    };

    fetchStoreName();
  }, [profile?.store_id]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        
        {/* Store Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <span className="font-medium">{storeName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <div className="flex flex-col">
                <span className="font-medium">Main Store</span>
                <span className="text-sm text-muted-foreground">Current Store</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Switch Store</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Store Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">{i18n.language === 'en' ? 'EN' : '中文'}</span>
        </Button>

        {/* Notifications */}
        <NotificationDropdown>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </NotificationDropdown>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block">{user?.email || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
              <User className="h-4 w-4 mr-2" />
              <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <EditProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </header>
  );
}