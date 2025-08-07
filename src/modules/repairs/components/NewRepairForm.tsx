import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { searchCustomers, CustomerOption } from '../api/customers';
import { searchProducts, ProductOption } from '../api/products';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSearchResults, setOrderSearchResults] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
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

  // Load initial data when component mounts
  React.useEffect(() => {
    // Load initial products
    searchProducts('').then(products => {
      setProductOptions(products);
    }).catch(console.error);
    
    // Load initial customers
    searchCustomers('').then(customers => {
      setCustomerOptions(customers);
    }).catch(console.error);
  }, []);

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

  // Handle customer search
  const handleCustomerSearch = async (query: string) => {
    try {
      const results = await searchCustomers(query);
      setCustomerOptions(results);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerOptions([]);
    }
  };

  // Handle product search
  const handleProductSearch = async (query: string) => {
    try {
      const results = await searchProducts(query);
      setProductOptions(results);
    } catch (error) {
      console.error('Error searching products:', error);
      setProductOptions([]);
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
      showError(t('repairs.messages.orderDetailsError'));
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
      
      showSuccess(t('repairs.messages.createSuccess'));
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/store/repairs/${repair.id}`);
      }
    } catch (error) {
      console.error('Error creating repair:', error);
      showError(t('repairs.messages.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const repairTypes = [
    { value: 'warranty', label: t('repairs.types.warranty') },
    { value: 'paid', label: t('repairs.types.paid') },
    { value: 'diagnostic', label: t('repairs.types.diagnostic') },
    { value: 'maintenance', label: t('repairs.types.maintenance') },
    { value: 'replacement', label: t('repairs.types.replacement') }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {t('repairs.form.title')}
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
                    <FormLabel>{t('repairs.form.type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('repairs.form.typeSelect')} />
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
                    <FormLabel>{t('repairs.form.product')}</FormLabel>
                    <FormControl>
                      <SelectWithSearch
                        options={productOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        onSearchChange={handleProductSearch}
                        placeholder={t('repairs.form.typeSelect')}
                        searchPlaceholder={t('repairs.form.productSearch')}
                        emptyText={t('repairs.form.productEmpty')}
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
                    <FormLabel>{t('repairs.form.originalOrder')}</FormLabel>
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
                        placeholder={t('repairs.form.typeSelect')}
                        searchPlaceholder={t('repairs.form.productSearch')}
                      />
                    </FormControl>
                    <FormMessage />
                    {selectedOrder && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>{t('repairs.form.order')}:</strong> {selectedOrder.order_number}</div>
                          <div><strong>{t('repairs.form.date')}:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</div>
                          <div><strong>{t('repairs.form.customer')}:</strong> {selectedOrder.customer_name}</div>
                          <div><strong>{t('repairs.form.warranty')}:</strong> {selectedOrder.warranty_years || 0} {t('repairs.form.years')}</div>
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
                    <FormLabel>{t('repairs.form.customer')}</FormLabel>
                    <FormControl>
                      <SelectWithSearch
                        options={customerOptions}
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-fill customer name based on selection
                          const selectedCustomer = customerOptions.find(c => c.value === value);
                          if (selectedCustomer) {
                            form.setValue('customerName', selectedCustomer.name);
                          }
                        }}
                        onSearchChange={handleCustomerSearch}
                        placeholder={t('repairs.form.typeSelect')}
                        searchPlaceholder={t('repairs.form.productSearch')}
                        emptyText={t('repairs.form.customerEmpty')}
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
                    <FormLabel>{t('repairs.form.customerName')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('repairs.form.customerNamePlaceholder')} 
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
                    <FormLabel>{t('repairs.form.estimatedCost')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder={t('repairs.form.costPlaceholder')} 
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
                    <FormLabel>{t('repairs.form.estimatedCompletion')}</FormLabel>
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
                              <span>{t('repairs.form.pickDate')}</span>
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
                  <FormLabel>{t('repairs.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('repairs.form.descriptionPlaceholder')}
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
                {isSubmitting ? t('repairs.form.creating') : t('repairs.form.createButton')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/store/repairs')}
                disabled={isSubmitting}
              >
                {t('repairs.form.cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}