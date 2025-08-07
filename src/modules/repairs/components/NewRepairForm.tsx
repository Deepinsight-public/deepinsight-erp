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
import { searchSalesOrders, getSalesOrderDetails } from '../api/salesOrders';
import { CreateRepairData } from '../types';
import { cn } from '@/lib/utils';

const repairFormSchema = z.object({
  type: z.string().min(1, 'Repair type is required'),
  productId: z.string().min(1, 'Product selection is required'),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  salesOrderId: z.string().optional(),
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
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSearchResults, setOrderSearchResults] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { showSuccess, showError } = useToastService();

  const form = useForm<RepairFormData>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: {
      type: '',
      productId: '',
      customerId: '',
      customerName: '',
      salesOrderId: '',
      description: '',
      cost: '',
    }
  });

  // Handle order search
  const handleOrderSearch = async (query: string) => {
    if (query.length < 2) {
      setOrderSearchResults([]);
      return;
    }
    
    try {
      const results = await searchSalesOrders(query);
      setOrderSearchResults(results);
    } catch (error) {
      console.error('Error searching orders:', error);
      setOrderSearchResults([]);
    }
  };

  // Handle order selection and auto-fill warranty info
  const handleOrderSelect = async (orderId: string) => {
    try {
      const orderDetails = await getSalesOrderDetails(orderId);
      if (orderDetails) {
        setSelectedOrder(orderDetails);
        form.setValue('salesOrderId', orderId);
        form.setValue('customerName', orderDetails.customer_name);
        
        // Auto-determine warranty status and expiry
        if (orderDetails.warranty_years && orderDetails.warranty_years > 0) {
          const warrantyExpiry = new Date(orderDetails.order_date);
          warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + orderDetails.warranty_years);
          
          const isUnderWarranty = warrantyExpiry > new Date();
          form.setValue('type', isUnderWarranty ? 'warranty' : 'paid');
        }
      }
    } catch (error) {
      console.error('Error getting order details:', error);
      showError('Failed to load order details');
    }
  };

  const onSubmit = async (data: RepairFormData) => {
    try {
      setIsSubmitting(true);
      
      // Calculate warranty status and expiry if order is selected
      let warrantyStatus = 'unknown';
      let warrantyExpiresAt: Date | undefined;
      
      if (selectedOrder && selectedOrder.warranty_years) {
        const orderDate = new Date(selectedOrder.order_date);
        warrantyExpiresAt = new Date(orderDate);
        warrantyExpiresAt.setFullYear(warrantyExpiresAt.getFullYear() + selectedOrder.warranty_years);
        warrantyStatus = warrantyExpiresAt > new Date() ? 'active' : 'expired';
      }
      
      const repairData: CreateRepairData = {
        type: data.type,
        productId: data.productId,
        customerId: data.customerId || undefined,
        customerName: data.customerName || undefined,
        salesOrderId: data.salesOrderId || undefined,
        description: data.description,
        cost: data.cost ? parseFloat(data.cost) : undefined,
        estimatedCompletion: data.estimatedCompletion,
        warrantyStatus,
        warrantyExpiresAt,
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
                          <SelectValue placeholder="Select" />
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
                        placeholder="Select"
                        searchPlaceholder="Search"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Original Order Search */}
              <FormField
                control={form.control}
                name="salesOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Order (Optional)</FormLabel>
                    <FormControl>
                      <SelectWithSearch
                        options={orderSearchResults.map(order => ({
                          value: order.id,
                          label: `${order.order_number} - ${order.customer_name} (${new Date(order.order_date).toLocaleDateString()})`
                        }))}
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value) {
                            handleOrderSelect(value);
                          } else {
                            setSelectedOrder(null);
                          }
                        }}
                        onSearchChange={handleOrderSearch}
                        placeholder="Select"
                        searchPlaceholder="Search"
                      />
                    </FormControl>
                    <FormMessage />
                    {selectedOrder && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Order:</strong> {selectedOrder.order_number}</div>
                          <div><strong>Date:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</div>
                          <div><strong>Customer:</strong> {selectedOrder.customer_name}</div>
                          <div><strong>Warranty:</strong> {selectedOrder.warranty_years || 0} years</div>
                        </div>
                      </div>
                    )}
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
                        placeholder="Select"
                        searchPlaceholder="Search"
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