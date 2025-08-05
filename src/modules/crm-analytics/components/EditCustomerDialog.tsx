import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormDialog } from '@/components/shared/FormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Customer } from '../types/customer';
import { updateCustomer } from '../api/customers';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

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
  const [loading, setLoading] = useState(false);

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
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer');
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
      title="Edit Customer"
      description="Update customer information."
      loading={loading}
      onSubmit={form.handleSubmit(handleSubmit)}
      onCancel={handleCancel}
      submitLabel="Update Customer"
    >
      <Form {...form}>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Customer name" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="customer@email.com" {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
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
                <FormLabel>Delivery Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="Customer delivery address" {...field} />
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