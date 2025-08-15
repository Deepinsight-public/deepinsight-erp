import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { FormDialog } from '@/components/shared/FormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Customer } from '../types/customer';
import { updateCustomer } from '../api/customers';
import { toast } from 'sonner';

type FormData = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onCustomerUpdated: (customer: Customer) => void;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onCustomerUpdated,
}: EditCustomerDialogProps) {
  const { t, ready } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Don't render until i18n is ready
  if (!ready) {
    return null;
  }

  const formSchema = z.object({
    name: z.string().min(1, t('customers.validation.nameRequired')),
    email: z.string().email(t('customers.validation.emailInvalid')),
    phone: z.string().optional(),
    address: z.string().optional(),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
      });
    }
  }, [customer, form]);

  const handleSubmit = async (data: FormData) => {
    if (!customer) return;

    try {
      setLoading(true);
      const updateData = {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
      };
      const updatedCustomer = await updateCustomer(customer.id, updateData);
      onCustomerUpdated(updatedCustomer);
      onOpenChange(false);
      toast.success(t('customers.edit.updateSuccess'));
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error(t('customers.edit.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('customers.edit.title')}
      description={t('customers.edit.description')}
      loading={loading}
      onSubmit={form.handleSubmit(handleSubmit)}
      onCancel={handleCancel}
      submitLabel={t('customers.edit.updateButton')}
    >
      <Form {...form}>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('customers.edit.nameLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('customers.edit.namePlaceholder')} {...field} />
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
                <FormLabel>{t('customers.edit.emailLabel')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('customers.edit.emailPlaceholder')} {...field} />
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
                <FormLabel>{t('customers.edit.phoneLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('customers.edit.phonePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('customers.edit.addressLabel')}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t('customers.edit.addressPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  );
}