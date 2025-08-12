import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataTable, FormDialog, SelectWithSearch, ConfirmDialog, LoadingOverlay } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SalesOrderDTO, SalesOrderLineDTO, ProductLookupItem } from '../types';
import { fetchProductLookup, fetchStockLevel, createSalesOrder, updateSalesOrder } from '../api/sales-orders';
import { supabase } from '@/integrations/supabase/client';

// Form validation schema with conditional address validation
const SalesOrderFormSchema = z.object({
  customerEmail: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  fulfillmentType: z.enum(['pick-up', 'delivery'], { message: 'Please select pick-up or delivery' }),
  customerPhone: z.string().min(1, 'Phone number is required'),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  zipcode: z.string().optional(),
  warrantyYears: z.number().min(0).optional(),
  warrantyAmount: z.number().min(0).optional(),
  accessory: z.string().optional(),
  otherFee: z.number().min(0).optional(),
  otherServices: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentNote: z.string().optional(),
  customerSource: z.string().optional(),
  cashierId: z.string().optional(),
  orderDate: z.string().optional()
}).refine((data) => {
  // If delivery is selected, address fields are required
  if (data.fulfillmentType === 'delivery') {
    return !!(data.street && data.city && data.state && data.country && data.zipcode);
  }
  return true;
}, {
  message: "Address fields are required for delivery orders",
  path: ["fulfillmentType"]
});

type SalesOrderFormData = z.infer<typeof SalesOrderFormSchema>;

interface SalesOrderFormProps {
  initialData?: SalesOrderDTO;
  onSave?: (order: SalesOrderDTO) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  street: string;
  zipcode: string;
}

interface StaffMember {
  id: string;
  name: string;
}

export function SalesOrderForm({ initialData, onSave, onCancel, readOnly = false }: SalesOrderFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<ProductLookupItem[]>([]);
  const [lines, setLines] = useState<SalesOrderLineDTO[]>(initialData?.lines || []);
  const [staffOptions, setStaffOptions] = useState<StaffMember[]>([]);
  const [customerFound, setCustomerFound] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<SalesOrderFormData>({
    resolver: zodResolver(SalesOrderFormSchema),
    defaultValues: {
      orderDate: initialData?.orderDate || new Date().toISOString().split('T')[0],
      fulfillmentType: (initialData?.walkInDelivery === 'walk-in' ? 'pick-up' : initialData?.walkInDelivery as 'pick-up' | 'delivery') || undefined,
      customerEmail: initialData?.customerEmail || '',
      customerPhone: initialData?.customerPhone || '',
      firstName: initialData?.customerFirst || '',
      lastName: initialData?.customerLast || '',
      country: initialData?.addrCountry || '',
      state: initialData?.addrState || '',
      city: initialData?.addrCity || '',
      street: initialData?.addrStreet || '',
      zipcode: initialData?.addrZipcode || '',
      paymentMethod: initialData?.paymentMethod || '',
      paymentNote: initialData?.paymentNote || '',
      customerSource: initialData?.customerSource || '',
      cashierId: initialData?.cashierId || '',
      warrantyYears: initialData?.warrantyYears || 1,
      warrantyAmount: initialData?.warrantyAmount || 0,
      accessory: initialData?.accessory || '',
      otherServices: initialData?.otherServices || '',
      otherFee: initialData?.otherFee || 0
    }
  });

  // Calculate totals including fees
  const calculateTotals = (orderLines: SalesOrderLineDTO[], warrantyAmount?: number, accessoryFee?: number, otherFee?: number, taxPct = 10) => {
    const linesSum = orderLines.reduce((sum, line) => sum + line.subTotal, 0);
    const linesDiscount = orderLines.reduce((sum, line) => 
      sum + (line.unitPrice * line.quantity * line.discountPercent / 100), 0
    );
    const linesSubTotal = linesSum - linesDiscount;
    
    const extras = (warrantyAmount ?? 0) + (accessoryFee ?? 0) + (otherFee ?? 0);
    const subTotal = linesSubTotal + extras;
    const taxAmount = subTotal * (taxPct / 100);
    const grandTotal = subTotal + taxAmount;
    
    return { 
      subTotal: linesSubTotal, 
      discountAmount: linesDiscount, 
      taxAmount, 
      totalAmount: grandTotal,
      extrasTotal: extras
    };
  };

  const totals = calculateTotals(
    lines, 
    watch('warrantyAmount'), 
    parseFloat(watch('accessory') || '0'), 
    watch('otherFee')
  );

  // Add new line item
  const handleAddItem = async (productId: string, quantity: number) => {
    try {
      // Find product details
      const product = productOptions.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if item already exists
      const existingLineIndex = lines.findIndex(line => line.productId === productId);
      if (existingLineIndex !== -1) {
        throw new Error('Product already added to order');
      }

      // Check stock availability (client-side validation)
      if (product.availableStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.availableStock}`);
      }

      const newLine: SalesOrderLineDTO = {
        id: Date.now().toString(),
        productId: product.id,
        sku: product.sku,
        productName: product.productName,
        quantity,
        unitPrice: product.price,
        discountPercent: 0,
        subTotal: quantity * product.price
      };

      setLines(prev => [...prev, newLine]);
      setShowAddItemDialog(false);
      toast({
        title: 'Success',
        description: 'Item added to order'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add item',
        variant: 'destructive'
      });
    }
  };

  // Update line item
  const handleUpdateLine = (lineId: string, updates: Partial<SalesOrderLineDTO>) => {
    setLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const updated = { ...line, ...updates };
        updated.subTotal = updated.quantity * updated.unitPrice * (1 - updated.discountPercent / 100);
        return updated;
      }
      return line;
    }));
  };

  // Delete line item
  const handleDeleteLine = (lineId: string) => {
    setLines(prev => prev.filter(line => line.id !== lineId));
    setShowDeleteDialog(null);
  };

  // Save order
  const handleSave = async (formData: SalesOrderFormData, status: 'draft' | 'submitted') => {
    setLoading(true);
    try {
      
      // Get user profile for store_id and user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.store_id) throw new Error('User profile not found');

      // Prepare order DTO
      const orderDTO: SalesOrderDTO = {
        id: initialData?.id,
        orderNumber: initialData?.orderNumber || `ORD-${Date.now()}`,
        customerName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        customerFirst: formData.firstName,
        customerLast: formData.lastName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        addrCountry: formData.country,
        addrState: formData.state,
        addrCity: formData.city,
        addrStreet: formData.street,
        addrZipcode: formData.zipcode,
        warrantyYears: formData.warrantyYears || 1,
        warrantyAmount: formData.warrantyAmount || 0,
        walkInDelivery: formData.fulfillmentType === 'pick-up' ? 'walk-in' : formData.fulfillmentType || 'walk-in',
        accessory: formData.accessory || '',
        otherServices: formData.otherServices,
        otherFee: formData.otherFee || 0,
        paymentMethod: formData.paymentMethod,
        paymentNote: formData.paymentNote,
        customerSource: formData.customerSource,
        totalAmount: totals.totalAmount,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        subTotal: totals.subTotal,
        status,
        orderDate: new Date().toISOString(),
        orderType: 'retail',
        storeId: profile.store_id,
        createdBy: user.id,
        cashierId: formData.cashierId || user.id,
        lines
      };

      let savedOrder;
      if (initialData?.id) {
        savedOrder = await updateSalesOrder(initialData.id, orderDTO);
      } else {
        savedOrder = await createSalesOrder(orderDTO);
      }

      // Save/update customer information in customers table
      if (formData.customerEmail) {
        try {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', formData.customerEmail)
            .maybeSingle();

          const customerData = {
            store_id: profile.store_id,
            first_name: formData.firstName || null,
            last_name: formData.lastName || null,
            email: formData.customerEmail,
            phone: formData.customerPhone || null,
            address: [
              formData.street,
              formData.city,
              formData.state,
              formData.zipcode,
              formData.country
            ].filter(Boolean).join(', ') || null,
            created_by: user.id
          };

          if (existingCustomer) {
            // Update existing customer
            await supabase
              .from('customers')
              .update(customerData)
              .eq('id', existingCustomer.id);
          } else {
            // Create new customer
            await supabase
              .from('customers')
              .insert(customerData);
          }
        } catch (customerError) {
          console.warn('Error saving customer:', customerError);
        }
      }

      toast({
        title: 'Success',
        description: `Order ${status === 'draft' ? 'saved as draft' : 'submitted'} successfully`
      });
      
      onSave?.(savedOrder);
    } catch (error) {
      console.error('Error saving sales order:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('INSUFFICIENT_STOCK')) {
          // Extract SKU from error message
          const match = error.message.match(/INSUFFICIENT_STOCK: (.+)/);
          errorMessage = match ? match[1] : 'Insufficient stock for one or more items';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: `Failed to save order: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Customer lookup by email
  const searchCustomerByEmail = useCallback(async (email: string) => {
    if (!email || email.length < 3) {
      setCustomerFound(false);
      return;
    }

    setIsSearchingCustomer(true);
    try {
      // Use Supabase to search for customer by email in customers table
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error) {
        throw error;
      }

      if (customers && customers.length > 0) {
        const customer = customers[0];
        setCustomerFound(true);
        
        // Use separate name fields from customer record
        const firstName = customer.first_name || '';
        const lastName = customer.last_name || '';

        console.log("Found customer:", customer);
        
        // Auto-fill form fields with customer data
        setValue('firstName', firstName);
        setValue('lastName', lastName);
        setValue('customerPhone', customer.phone || '');
        
        // Auto-fill address if available
        if (customer.address) {
          const addressParts = customer.address.split(', ');
          if (addressParts.length >= 1) setValue('street', addressParts[0] || '');
          if (addressParts.length >= 2) setValue('city', addressParts[1] || '');
          if (addressParts.length >= 3) setValue('state', addressParts[2] || '');
          if (addressParts.length >= 4) setValue('zipcode', addressParts[3] || '');
          if (addressParts.length >= 5) setValue('country', addressParts[4] || '');
        }
        
        toast({
          title: 'Customer Found',
          description: `Auto-filled details for ${firstName} ${lastName}`
        });
      } else {
        setCustomerFound(false);
      }
    } catch (error) {
      console.error('Customer search failed:', error);
      setCustomerFound(false);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [setValue, toast]);

  // Debounced email search - only for new orders
  useEffect(() => {
    // Don't search if we have initial data (viewing existing order)
    if (initialData?.id) return;
    
    const email = watch('customerEmail');
    const timeoutId = setTimeout(() => {
      if (email && !customerFound) {
        searchCustomerByEmail(email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch('customerEmail'), searchCustomerByEmail, customerFound, initialData?.id]);

  // Load staff options
  useEffect(() => {
    const loadStaff = async () => {
      try {
        // Use Supabase to get staff from profiles table
        const { data: staff, error } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name');

        if (error) {
          throw error;
        }

        const staffOptions = staff?.map((s: any) => ({
          id: s.user_id,
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown'
        })) || [];

        setStaffOptions(staffOptions);
      } catch (error) {
        console.error('Failed to load staff:', error);
        // Mock data for demo
        setStaffOptions([
          { id: '1', name: 'John Smith' },
          { id: '2', name: 'Sarah Johnson' },
          { id: '3', name: 'Mike Chen' },
        ]);
      }
    };
    loadStaff();
  }, []);

  // Product search
  const handleProductSearch = async (search: string) => {
    console.log('handleProductSearch called with:', search);
    
    try {
      const { searchAvailableProducts } = await import('../api/products');
      const products = await searchAvailableProducts(search);
      console.log('Setting product options:', products);
      setProductOptions(products);
    } catch (error) {
      console.error('Failed to search products:', error);
      toast({
        title: 'Error',
        description: 'Failed to search products',
        variant: 'destructive'
      });
    }
  };

  const lineColumns = [
    {
      key: 'sku',
      title: 'SKU',
      render: (value: string, record: SalesOrderLineDTO) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{record.productName}</div>
        </div>
      )
    },
    {
      key: 'quantity',
      title: 'Quantity',
      render: (value: number, record: SalesOrderLineDTO) => readOnly ? (
        <span>{value}</span>
      ) : (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleUpdateLine(record.id!, { quantity: parseInt(e.target.value) || 0 })}
          className="w-20"
          min="1"
        />
      )
    },
    {
      key: 'unitPrice',
      title: 'Unit Price',
      render: (value: number, record: SalesOrderLineDTO) => readOnly ? (
        <span>${value.toFixed(2)}</span>
      ) : (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleUpdateLine(record.id!, { unitPrice: parseFloat(e.target.value) || 0 })}
          className="w-24"
          min="0"
          step="0.01"
        />
      )
    },
    {
      key: 'discountPercent',
      title: 'Discount %',
      render: (value: number, record: SalesOrderLineDTO) => readOnly ? (
        <span>{value}%</span>
      ) : (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleUpdateLine(record.id!, { discountPercent: parseFloat(e.target.value) || 0 })}
          className="w-20"
          min="0"
          max="100"
          step="0.1"
        />
      )
    },
    {
      key: 'subTotal',
      title: 'Sub-total',
      render: (value: number) => <span className="font-medium">${value.toFixed(2)}</span>
    },
    ...(readOnly ? [] : [{
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: SalesOrderLineDTO) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(record.id!)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }])
  ];

  return (
    <div className="space-y-6">
      {loading && <LoadingOverlay />}
      
      {/* Order Information */}
      <Card className="p-6 space-y-6">
        {/* Customer Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerEmail">
                Email (lookup key) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                disabled={readOnly}
                placeholder="customer@example.com"
                className={cn(
                  customerFound && "border-success",
                  errors.customerEmail && "border-destructive"
                )}
              />
              {isSearchingCustomer && (
                <p className="text-xs text-muted-foreground mt-1">Searching customer...</p>
              )}
              {customerFound && (
                <p className="text-xs text-success mt-1">Customer found and details auto-filled</p>
              )}
              {errors.customerEmail && (
                <p className="text-xs text-destructive mt-1">{errors.customerEmail.message}</p>
              )}
            </div>
            <div />
            
            <div>
              <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                {...register('firstName')}
                disabled={readOnly}
                placeholder=""
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
              <Input
                id="lastName"
                {...register('lastName')}
                disabled={readOnly}
                placeholder=""
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Phone <span className="text-destructive">*</span></Label>
              <Input
                id="customerPhone"
                {...register('customerPhone')}
                disabled={readOnly}
                placeholder=""
                className={errors.customerPhone ? "border-destructive" : ""}
              />
              {errors.customerPhone && (
                <p className="text-xs text-destructive mt-1">{errors.customerPhone.message}</p>
              )}
            </div>
            <div />
          </div>
        </div>

        {/* Address Information - Only show for delivery */}
        {watch('fulfillmentType') === 'delivery' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">
                  Street Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="street"
                  {...register('street')}
                  disabled={readOnly}
                  placeholder="123 Main Street"
                  className={errors.fulfillmentType ? "border-destructive" : ""}
                />
              </div>
              <div>
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  {...register('city')}
                  disabled={readOnly}
                  placeholder="New York"
                  className={errors.fulfillmentType ? "border-destructive" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state"
                  {...register('state')}
                  disabled={readOnly}
                  placeholder="NY"
                  className={errors.fulfillmentType ? "border-destructive" : ""}
                />
              </div>
              <div>
                <Label htmlFor="zipcode">
                  Zipcode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zipcode"
                  {...register('zipcode')}
                  disabled={readOnly}
                  placeholder="10001"
                  className={errors.fulfillmentType ? "border-destructive" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  {...register('country')}
                  disabled={readOnly}
                  placeholder="USA"
                  className={errors.fulfillmentType ? "border-destructive" : ""}
                />
              </div>
            </div>
            {errors.fulfillmentType && (
              <p className="text-sm text-destructive mt-2">
                {errors.fulfillmentType.message}
              </p>
            )}
          </div>
        )}

        {/* Order Details */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Order Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watch('orderDate') && "text-muted-foreground"
                    )}
                    disabled={readOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('orderDate') ? format(new Date(watch('orderDate')), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('orderDate') ? new Date(watch('orderDate')) : undefined}
                    onSelect={(date) => setValue('orderDate', date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Pick-up / Delivery <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={watch('fulfillmentType')}
                onValueChange={(value) => setValue('fulfillmentType', value as 'pick-up' | 'delivery')}
                disabled={readOnly}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pick-up" id="pick-up" />
                  <Label htmlFor="pick-up">Pick-up</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
              </RadioGroup>
              {!watch('fulfillmentType') && !readOnly && (
                <p className="text-xs text-destructive mt-1">Please choose pick-up or delivery</p>
              )}
              {errors.fulfillmentType && (
                <p className="text-xs text-destructive mt-1">{errors.fulfillmentType.message}</p>
              )}
            </div>
            
            <div>
              <Label>Payment Method</Label>
              <Select 
                value={watch('paymentMethod')} 
                onValueChange={(value) => setValue('paymentMethod', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paymentNote">Payment Note</Label>
              <Textarea
                id="paymentNote"
                {...register('paymentNote')}
                disabled={readOnly}
                placeholder="Optional payment notes..."
                className="min-h-[40px] resize-none"
              />
            </div>
            
            <div>
              <Label>Customer Source</Label>
              <Select 
                value={watch('customerSource')} 
                onValueChange={(value) => setValue('customerSource', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storefront">Storefront</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Cashier</Label>
              <SelectWithSearch
                options={staffOptions.map(staff => ({
                  value: staff.id,
                  label: staff.name
                }))}
                value={watch('cashierId')}
                onValueChange={(value) => setValue('cashierId', value)}
                placeholder="Select cashier..."
                disabled={readOnly}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Warranty & Extras */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Warranty & Extras</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warrantyYears">Warranty (years)</Label>
              <Input
                id="warrantyYears"
                type="number"
                {...register('warrantyYears', { valueAsNumber: true })}
                disabled={readOnly}
                min="0"
                step="1"
              />
            </div>
            
            <div>
              <Label htmlFor="warrantyAmount">Warranty Amount ($)</Label>
              <Input
                id="warrantyAmount"
                type="number"
                {...register('warrantyAmount', { valueAsNumber: true })}
                disabled={readOnly}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="accessory">Accessory Fee ($)</Label>
              <Input
                id="accessory"
                type="number"
                {...register('accessory')}
                disabled={readOnly}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="otherServices">Other Services</Label>
              <Input
                id="otherServices"
                {...register('otherServices')}
                disabled={readOnly}
                placeholder="Installation, setup, etc..."
              />
            </div>
            
            <div>
              <Label htmlFor="otherFee">Other Fee ($)</Label>
              <Input
                id="otherFee"
                type="number"
                {...register('otherFee', { valueAsNumber: true })}
                disabled={readOnly}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            {!readOnly && (
              <Button onClick={() => setShowAddItemDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={lines}
            columns={lineColumns}
          />
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Total Qty:</span>
            <span>{lines.reduce((sum, line) => sum + line.quantity, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Items Sub-total:</span>
            <span>${totals.subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-${totals.discountAmount.toFixed(2)}</span>
          </div>
          {totals.extrasTotal > 0 && (
            <div className="flex justify-between">
              <span>Extras (Warranty + Accessory + Other):</span>
              <span>${totals.extrasTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax (10%):</span>
            <span>${totals.taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span>${totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleSubmit((data) => handleSave(data, 'draft'))}
            disabled={loading}
          >
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit((data) => {
              if (!data.fulfillmentType) {
                toast({
                  title: 'Validation Error',
                  description: 'Please choose pick-up or delivery',
                  variant: 'destructive'
                });
                return;
              }
              if (!data.customerEmail || !data.firstName || !data.lastName) {
                toast({
                  title: 'Validation Error',
                  description: 'Please fill in all required customer information (Email, First Name, Last Name)',
                  variant: 'destructive'
                });
                return;
              }
              if (lines.length === 0) {
                toast({
                  title: 'Validation Error',
                  description: 'Please add at least one item to the order',
                  variant: 'destructive'
                });
                return;
              }
              handleSave(data, 'submitted');
            })}
            disabled={loading}
          >
            Submit Order
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Add Item Dialog */}
      <AddItemDialog
        open={showAddItemDialog}
        onClose={() => setShowAddItemDialog(false)}
        onAdd={handleAddItem}
        onProductSearch={handleProductSearch}
        productOptions={productOptions}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!showDeleteDialog}
        onOpenChange={() => setShowDeleteDialog(null)}
        onConfirm={() => showDeleteDialog && handleDeleteLine(showDeleteDialog)}
        title="Delete Item"
        description="Are you sure you want to remove this item from the order?"
      />
    </div>
  );
}

// Add Item Dialog Component
interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (productId: string, quantity: number) => void;
  onProductSearch: (search: string) => void;
  productOptions: ProductLookupItem[];
}

function AddItemDialog({ open, onClose, onAdd, onProductSearch, productOptions }: AddItemDialogProps) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Load initial products when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened, loading initial products');
      // Load all available products initially
      onProductSearch('');
    } else {
      setSelectedProduct('');
      setQuantity(1);
    }
  }, [open, onProductSearch]);

  const handleAdd = () => {
    if (selectedProduct && quantity > 0) {
      onAdd(selectedProduct, quantity);
      setSelectedProduct('');
      setQuantity(1);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onClose}
      title="Add Item to Order"
      onSubmit={handleAdd}
      onCancel={onClose}
      submitLabel="Add Item"
    >
      <div className="space-y-4">
        <div>
          <Label>Product</Label>
          <SelectWithSearch
            options={productOptions.map(p => ({
              value: p.id,
              label: `${p.sku} - ${p.productName} ($${p.price.toFixed(2)}) - Stock: ${p.availableStock}`,
              disabled: p.availableStock === 0
            }))}
            value={selectedProduct}
            onValueChange={setSelectedProduct}
            placeholder="Search products..."
            searchPlaceholder="Type to search..."
            onSearchChange={onProductSearch}
            className="w-full"
            popoverClassName="min-w-[340px] w-full"
            renderOption={(option) => {
              const product = productOptions.find(p => p.id === option.value);
              if (!product) return option.label;
              
              const isOutOfStock = product.availableStock === 0;
              
              return (
                <div className={`flex items-center justify-between w-full ${isOutOfStock ? 'opacity-50' : ''}`}>
                  <span className="font-medium truncate flex-1">{product.sku} – {product.productName}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                    <span>•</span>
                    <span className={isOutOfStock ? 'text-destructive font-medium' : ''}>
                      In stock: {product.availableStock}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            max={selectedProduct ? productOptions.find(p => p.id === selectedProduct)?.availableStock || 1 : undefined}
          />
          {selectedProduct && (
            <p className="text-sm text-muted-foreground mt-1">
              Max available: {productOptions.find(p => p.id === selectedProduct)?.availableStock || 0}
            </p>
          )}
        </div>
      </div>
    </FormDialog>
  );
}