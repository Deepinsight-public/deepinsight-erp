import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { returnFormSchema, type ReturnFormData, type CustomerLookupResult, type ProductMapData } from '../types/newReturn';
import { 
  searchCustomersByEmail, 
  getWarehouses, 
  searchProducts, 
  getProductMapPrice, 
  createAfterSalesReturn 
} from '../api/newReturns';
import { cn } from '@/lib/utils';

const RETURN_REASONS = [
  { value: 'damage', label: 'Damaged Product' },
  { value: 'defect', label: 'Manufacturing Defect' },
  { value: 'wrong_item', label: 'Wrong Item Received' },
  { value: 'other', label: 'Other' },
];

export function NewReturnForm() {
  const navigate = useNavigate();
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerLookupResult[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<{ value: string; label: string }[]>([]);
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([]);
  const [mapPrice, setMapPrice] = useState<number | null>(null);
  const [showMapPopover, setShowMapPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerAutoFilled, setCustomerAutoFilled] = useState(false);

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      returnDate: new Date(),
      returnType: 'store',
      customerEmail: '',
      customerFirst: '',
      customerLast: '',
      warehouseId: '',
      productId: '',
      reason: '',
      refundAmount: 0,
    },
  });

  const returnType = form.watch('returnType');

  // Load warehouses and initial products when component mounts
  React.useEffect(() => {
    getWarehouses().then(setWarehouseOptions).catch(console.error);
    // Load initial products
    searchProducts('').then(products => {
      const options = products.map(product => ({
        value: product.id,
        label: `${product.sku} - ${product.productName} (Stock: ${product.availableStock})`,
      }));
      setProductOptions(options);
    }).catch(console.error);
  }, []);

  const handleCustomerEmailSearch = async (email: string) => {
    if (!email.trim()) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const customers = await searchCustomersByEmail(email);
      setCustomerSuggestions(customers);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSelect = (customer: CustomerLookupResult) => {
    form.setValue('customerEmail', customer.email);
    form.setValue('customerFirst', customer.customerFirst || '');
    form.setValue('customerLast', customer.customerLast || '');
    setCustomerAutoFilled(true);
    setCustomerSuggestions([]);
  };

  const handleProductSearch = async (search: string) => {
    try {
      const products = await searchProducts(search);
      const options = products.map(product => ({
        value: product.id,
        label: `${product.sku} - ${product.productName} (Stock: ${product.availableStock})`,
      }));
      setProductOptions(options);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleProductSelect = async (productId: string) => {
    form.setValue('productId', productId);
    
    try {
      const mapData = await getProductMapPrice(productId);
      setMapPrice(mapData.mapPrice);
      if (mapData.mapPrice > 0) {
        setShowMapPopover(true);
        // Auto-hide popover after 3 seconds
        setTimeout(() => setShowMapPopover(false), 3000);
      }
    } catch (error) {
      console.error('Error fetching MAP price:', error);
    }
  };

  const onSubmit = async (data: ReturnFormData) => {
    setIsSubmitting(true);
    
    try {
      const newReturn = await createAfterSalesReturn(data);
      toast.success('Return record created successfully');
      navigate(`/store/after-sales/returns/${newReturn.id}`);
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Failed to create return record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Return</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Return Date */}
            <FormField
              control={form.control}
              name="returnDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Return Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
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
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Return Type */}
            <FormField
              control={form.control}
              name="returnType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Return Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="store" id="store" />
                        <Label htmlFor="store">Return to Store</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="warehouse" id="warehouse" />
                        <Label htmlFor="warehouse">Return to Warehouse</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Information (when return type is 'store') */}
            {returnType === 'store' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter customer email"
                            onChange={(e) => {
                              field.onChange(e);
                              setCustomerAutoFilled(false);
                              handleCustomerEmailSearch(e.target.value);
                            }}
                            onBlur={() => {
                              // Clear suggestions after a delay
                              setTimeout(() => setCustomerSuggestions([]), 200);
                            }}
                          />
                          {customerSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {customerSuggestions.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md"
                                  onClick={() => handleCustomerSelect(customer)}
                                >
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-sm text-muted-foreground">{customer.email}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerFirst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="First name"
                            disabled={customerAutoFilled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerLast"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Last name"
                            disabled={customerAutoFilled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Warehouse Selection (when return type is 'warehouse') */}
            {returnType === 'warehouse' && (
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <FormControl>
                      <SelectWithSearch
                        options={warehouseOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select warehouse..."
                        searchPlaceholder="Search warehouses..."
                        emptyText="No warehouses found."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Product Type
                    {mapPrice !== null && mapPrice > 0 && (
                      <Popover open={showMapPopover} onOpenChange={setShowMapPopover}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <div className="text-sm">
                            <strong>MAP 价格:</strong> ${mapPrice.toFixed(2)} (仅供参考)
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </FormLabel>
                  <FormControl>
                    <SelectWithSearch
                      options={productOptions}
                      value={field.value}
                      onValueChange={handleProductSelect}
                      onSearchChange={handleProductSearch}
                      placeholder="Search and select product..."
                      searchPlaceholder="Search by SKU or product name..."
                      emptyText="No products found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return Reason</FormLabel>
                  <FormControl>
                    <SelectWithSearch
                      options={RETURN_REASONS}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select return reason..."
                      renderOption={(option) => option.label}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Reason (if "other" is selected) */}
            {form.watch('reason') === 'other' && (
              <FormItem>
                <FormLabel>Please specify the reason</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please describe the reason for return..."
                    value={form.watch('reason') === 'other' ? '' : form.watch('reason')}
                    onChange={(e) => form.setValue('reason', e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}

            {/* Refund Amount */}
            <FormField
              control={form.control}
              name="refundAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/store/after-sales/returns')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Return'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}