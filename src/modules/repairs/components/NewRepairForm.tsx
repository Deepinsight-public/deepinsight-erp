import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToastService } from '@/components/shared/ToastService';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';

import { createRepair } from '../api/repairs';
import { CreateRepairData } from '../types';
import { cn } from '@/lib/utils';

const repairFormSchema = z.object({
  type: z.string().min(1, 'Repair type is required'),
  productId: z.string().min(1, 'Product selection is required'),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  cost: z.string().optional(),
  estimatedCompletion: z.date().optional(),
});

type RepairFormData = z.infer<typeof repairFormSchema>;

interface NewRepairFormProps {
  onSuccess?: () => void;
}

export function NewRepairForm({ onSuccess }: NewRepairFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToastService();

  const form = useForm<RepairFormData>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: {
      type: '',
      productId: '',
      customerId: '',
      customerName: '',
      description: '',
      cost: '',
    }
  });

  const onSubmit = async (data: RepairFormData) => {
    try {
      setIsSubmitting(true);
      
      const repairData: CreateRepairData = {
        type: data.type,
        productId: data.productId,
        customerId: data.customerId || undefined,
        customerName: data.customerName || undefined,
        description: data.description,
        cost: data.cost ? parseFloat(data.cost) : undefined,
        estimatedCompletion: data.estimatedCompletion,
      };

      const repair = await createRepair(repairData);
      
      showSuccess('Repair created successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/store/repairs/${repair.id}`);
      }
    } catch (error) {
      console.error('Error creating repair:', error);
      showError('Failed to create repair. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const repairTypes = [
    { value: 'warranty', label: 'Warranty Repair' },
    { value: 'paid', label: 'Paid Repair' },
    { value: 'diagnostic', label: 'Diagnostic' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'replacement', label: 'Replacement' }
  ];

  // Mock product options - in real app this would come from an API
  const productOptions = [
    { value: 'prod-1', label: 'iPhone 15 Pro Max - Space Black' },
    { value: 'prod-2', label: 'MacBook Pro 16" M3 Max' },
    { value: 'prod-3', label: 'iPad Air 11" M2' },
    { value: 'prod-4', label: 'Apple Watch Series 9 GPS' }
  ];

  // Mock customer options - in real app this would come from an API
  const customerOptions = [
    { value: 'cust-1', label: 'John Smith (john@example.com)' },
    { value: 'cust-2', label: 'Sarah Johnson (sarah@example.com)' },
    { value: 'cust-3', label: 'Mike Chen (mike@example.com)' },
    { value: 'cust-4', label: 'Emily Davis (emily@example.com)' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Repair
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Repair Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repair Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select repair type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {repairTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Selection */}
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <SelectWithSearch
                        options={productOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search and select product..."
                        searchPlaceholder="Search products..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <FormControl>
                      <SelectWithSearch
                        options={customerOptions}
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-fill customer name based on selection
                          const selectedCustomer = customerOptions.find(c => c.value === value);
                          if (selectedCustomer) {
                            const name = selectedCustomer.label.split(' (')[0];
                            form.setValue('customerName', name);
                          }
                        }}
                        placeholder="Search and select customer..."
                        searchPlaceholder="Search customers..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter customer name..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Cost */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Completion */}
              <FormField
                control={form.control}
                name="estimatedCompletion"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Estimated Completion</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repair Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the issue, symptoms, and required repairs..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Repair'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/store/repairs')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}