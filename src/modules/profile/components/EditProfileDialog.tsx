import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile, searchStores } from '../api/profile';
import { ProfileFormData, Store, USER_ROLES } from '../types';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { t } = useTranslation();
  const { user, profile, refreshProfile, hasPermission } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  
  const formSchema = z.object({
    full_name: z.string().min(1, t('profile.edit.validation.firstNameRequired')).max(30, t('profile.edit.validation.firstNameLength')),
    email: z.string().email(t('profile.edit.emailInvalid')),
    phone: z.string().optional(),
    role: z.enum(USER_ROLES).optional(),
    store_id: z.string().optional(),
  });
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
      role: profile?.role || '',
      store_id: profile?.store_id || '',
    },
  });

  React.useEffect(() => {
    if (profile && open) {
      form.reset({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        role: profile.role || '',
        store_id: profile.store_id || '',
      });
    }
  }, [profile, user, open, form]);

  // Load stores when dialog opens
  useEffect(() => {
    if (open) {
      const loadStores = async () => {
        try {
          setLoadingStores(true);
          const storesData = await searchStores();
          setStores(storesData);
        } catch (error) {
          console.error('Failed to load stores:', error);
        } finally {
          setLoadingStores(false);
        }
      };
      loadStores();
    }
  }, [open]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return;

    try {
      await updateProfile(user.id, {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || undefined,
        role: data.role || undefined,
        store_id: data.store_id || undefined,
      });

      toast({
        title: t('auth.success'),
        description: t('profile.edit.success'),
      });
      
      // Refresh the auth context to show updated data
      await refreshProfile();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : t('profile.edit.error'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('profile.edit.title')}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.edit.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('profile.edit.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.edit.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('profile.edit.emailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.edit.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('profile.edit.phonePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.edit.role')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!hasPermission('manage_users')}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('profile.edit.rolePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {!hasPermission('manage_users') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('profile.edit.roleReadOnly')}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="store_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.edit.store')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!hasPermission('manage_users')}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('profile.edit.storePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStores ? (
                          <SelectItem value="" disabled>
                            {t('common.loading')}
                          </SelectItem>
                        ) : stores.length === 0 ? (
                          <SelectItem value="" disabled>
                            {t('profile.edit.noStoresFound')}
                          </SelectItem>
                        ) : (
                          stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.store_name} ({store.store_code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {!hasPermission('manage_users') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('profile.edit.storeReadOnly')}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}