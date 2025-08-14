import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

// Payment Methods Section Component
const PaymentMethodsSection = ({ control, watch, setValue, readOnly, totals }) => {
  const { t } = useTranslation();
  const paymentMethods = watch('paymentMethods') || [{ method: '', amount: 0, note: '' }];
  
  const addPaymentMethod = () => {
    if (paymentMethods.length < 3) {
      const newMethods = [...paymentMethods, { method: '', amount: 0, note: '' }];
      setValue('paymentMethods', newMethods);
    }
  };
  
  const removePaymentMethod = (index) => {
    if (paymentMethods.length > 1) {
      const newMethods = paymentMethods.filter((_, i) => i !== index);
      setValue('paymentMethods', newMethods);
    }
  };
  
  const updatePaymentMethod = (index, field, value) => {
    const newMethods = [...paymentMethods];
    newMethods[index] = { ...newMethods[index], [field]: value };
    setValue('paymentMethods', newMethods);
  };
  
  const remainingAmount = totals.totalAmount - paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0);
  
  return (
    <div className="space-y-3">
      {paymentMethods.map((paymentMethod, index) => (
        <div key={index} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t('salesOrder.form.payment.title', { number: index + 1 })}</Label>
            {paymentMethods.length > 1 && !readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removePaymentMethod(index)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">{t('salesOrder.form.payment.method')}</Label>
              <Select
                value={paymentMethod.method}
                onValueChange={(value) => updatePaymentMethod(index, 'method', value)}
                disabled={readOnly}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t('salesOrder.form.payment.selectMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('salesOrder.form.payment.cash')}</SelectItem>
                  <SelectItem value="card">{t('salesOrder.form.payment.card')}</SelectItem>
                  <SelectItem value="bank-transfer">{t('salesOrder.form.payment.bankTransfer')}</SelectItem>
                  <SelectItem value="cheque">{t('salesOrder.form.payment.cheque')}</SelectItem>
                  <SelectItem value="other">{t('salesOrder.form.payment.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs">{t('salesOrder.form.payment.amount')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={remainingAmount + (paymentMethod.amount || 0)}
                value={paymentMethod.amount || ''}
                onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                disabled={readOnly}
                className="h-8"
                placeholder={t('salesOrder.form.payment.amountPlaceholder')}
              />
            </div>
            
            <div>
              <Label className="text-xs">Note</Label>
              <Input
                value={paymentMethod.note || ''}
                onChange={(e) => updatePaymentMethod(index, 'note', e.target.value)}
                disabled={readOnly}
                className="h-8"
                placeholder="Optional note"
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex items-center justify-between">
        {!readOnly && paymentMethods.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPaymentMethod}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </Button>
        )}
        
        <div className="text-sm text-muted-foreground">
          Remaining: ${remainingAmount.toFixed(2)} / Total: ${totals.totalAmount.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

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
      paymentMethods: z.array(z.object({
      method: z.string(),
      amount: z.number().min(0),
      note: z.string().optional()
    })).max(3, "Maximum 3 payment methods allowed").optional(),
  paymentNote: z.string().optional(),
  customerSource: z.string().optional(),
  cashierId: z.string().optional(),
  orderDate: z.string().optional(),
  storeInvoiceNumber: z.string().optional()
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
  
  const { register, handleSubmit, watch, setValue, getValues, control, formState: { errors } } = useForm<SalesOrderFormData>({
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
      paymentMethods: initialData?.paymentMethods || [{ method: '', amount: 0, note: '' }],
      paymentNote: initialData?.paymentNote || '',
      customerSource: initialData?.customerSource || '',
      cashierId: initialData?.cashierId || '',
      storeInvoiceNumber: initialData?.storeInvoiceNumber || '',
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
        paymentMethod: formData.paymentMethods?.[0]?.method || null,
        paymentMethods: formData.paymentMethods || [],
        paymentNote: formData.paymentNote,
        customerSource: formData.customerSource,
        storeInvoiceNumber: formData.storeInvoiceNumber,
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

      console.log('=== CUSTOMER SAVE DEBUG START ===');
      console.log('Form data received:', formData);
      console.log('Customer email:', formData.customerEmail);
      console.log('Customer first name:', formData.firstName);
      console.log('Customer last name:', formData.lastName);
      console.log('Profile store_id:', profile.store_id);
      console.log('User ID:', user.id);

      // Save/update customer information in customers table
      if (formData.customerEmail && formData.firstName && formData.lastName) {
        console.log('Attempting to save customer data...');
        try {
          // First check if customer exists with both email and store_id
          const { data: existingCustomer, error: searchError } = await supabase
            .from('customers')
            .select('id, email, first_name, last_name')
            .eq('email', formData.customerEmail.toLowerCase().trim())
            .eq('store_id', profile.store_id)
            .maybeSingle();

          if (searchError) {
            console.error('Error searching for existing customer:', searchError);
            throw searchError;
          }

                // Create customer data with the fields we know work
      const customerData = {
        store_id: profile.store_id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.customerEmail.toLowerCase().trim(),
        phone: formData.customerPhone?.trim() || null,
        address: [
          formData.street?.trim(),
          formData.city?.trim(),
          formData.state?.trim(),
          formData.zipcode?.trim(),
          formData.country?.trim()
        ].filter(Boolean).join(', ') || null
      };

          console.log('Customer data to save:', customerData);
          console.log('Existing customer found:', existingCustomer);

          if (existingCustomer) {
            // Update existing customer
            console.log('Updating existing customer with ID:', existingCustomer.id);
            const { data: updatedCustomer, error: updateError } = await supabase
              .from('customers')
              .update({
                first_name: customerData.first_name,
                last_name: customerData.last_name,
                phone: customerData.phone,
                address: customerData.address
              })
              .eq('id', existingCustomer.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating customer:', updateError);
              throw updateError;
            }
            
            console.log('Customer updated successfully:', updatedCustomer);
            toast({
              title: 'Customer Updated',
              description: `Updated details for ${customerData.first_name} ${customerData.last_name}`,
              variant: 'default'
            });
          } else {
            // Create new customer - try using CRM module approach
            console.log('Creating new customer via CRM pattern...');
            try {
              // Import and use the CRM addCustomer function
              const { addCustomer } = await import('@/modules/crm-analytics/api/customers');
              
              const fullName = `${formData.firstName} ${formData.lastName}`.trim();
              const customerAddress = [
                formData.street?.trim(),
                formData.city?.trim(),
                formData.state?.trim(),
                formData.zipcode?.trim(),
                formData.country?.trim()
              ].filter(Boolean).join(', ') || '';
              
              const newCustomer = await addCustomer({
                name: fullName,
                email: formData.customerEmail,
                phone: formData.customerPhone || '',
                address: customerAddress
              });
              
              console.log('Customer created successfully via CRM:', newCustomer);
              toast({
                title: 'Customer Created',
                description: `Created new customer: ${fullName}`,
                variant: 'default'
              });
            } catch (crmError) {
              console.error('CRM module failed, trying direct insert:', crmError);
              
              // Fallback to direct insert with array format
              const { data: newCustomer, error: insertError } = await supabase
                .from('customers')
                .insert([customerData])  // Use array format
                .select()
                .single();

              if (insertError) {
                console.error('Error creating customer:', insertError);
                throw insertError;
              }
              
              console.log('Customer created successfully (direct):', newCustomer);
              toast({
                title: 'Customer Created',
                description: `Created new customer: ${customerData.first_name} ${customerData.last_name}`,
                variant: 'default'
              });
            }
          }
        } catch (customerError) {
          console.error('Error saving customer:', customerError);
          toast({
            title: 'Customer Save Warning',
            description: `Order saved but customer data could not be saved: ${customerError.message}`,
            variant: 'destructive'
          });
        }
      } else {
        console.log('Skipping customer save - missing required customer information');
        console.log('Email provided:', !!formData.customerEmail);
        console.log('First name provided:', !!formData.firstName);
        console.log('Last name provided:', !!formData.lastName);
      }
      
      console.log('=== CUSTOMER SAVE DEBUG END ===');

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
    console.log('searchCustomerByEmail called with:', email);
    
    if (!email || email.length < 3) {
      console.log('Email too short, skipping search');
      setCustomerFound(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format, skipping search');
      setCustomerFound(false);
      return;
    }

    console.log('Starting customer search for:', email);
    setIsSearchingCustomer(true);
    
    try {
      // Get current user's store_id for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setCustomerFound(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.store_id) {
        console.log('No store_id found for user');
        setCustomerFound(false);
        return;
      }

      // Use Supabase to search for customer by email in customers table
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('store_id', profile.store_id)
        .limit(1);

      console.log('Customer search result:', { customers, error });

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
        
        // Auto-fill address if available - improved parsing
        if (customer.address) {
          console.log('Parsing address:', customer.address);
          const addressParts = customer.address.split(', ').filter(part => part.trim());
          
          // More flexible address parsing
          if (addressParts.length >= 5) {
            // Full address: street, city, state, zipcode, country
            setValue('street', addressParts[0] || '');
            setValue('city', addressParts[1] || '');
            setValue('state', addressParts[2] || '');
            setValue('zipcode', addressParts[3] || '');
            setValue('country', addressParts[4] || '');
          } else if (addressParts.length >= 3) {
            // Partial address: assume street, city, state/country
            setValue('street', addressParts[0] || '');
            setValue('city', addressParts[1] || '');
            setValue('state', addressParts[2] || '');
          } else if (addressParts.length >= 1) {
            // Just street or combined address
            setValue('street', addressParts[0] || '');
          }
        }
        
        toast({
          title: 'Customer Found',
          description: `Auto-filled details for ${firstName} ${lastName}`,
          variant: 'default'
        });
      } else {
        console.log('No customer found with email:', email);
        setCustomerFound(false);
      }
    } catch (error) {
      console.error('Customer search failed:', error);
      setCustomerFound(false);
      toast({
        title: 'Search Error',
        description: 'Failed to search for customer. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [setValue, toast]);

  // Debounced email search - only for new orders
  useEffect(() => {
    // Don't search if we have initial data (viewing existing order)
    if (initialData?.id) {
      console.log('Skipping customer search - editing existing order');
      return;
    }
    
    const email = watch('customerEmail');
    console.log('Email changed to:', email, 'customerFound:', customerFound);
    
    if (!email) {
      setCustomerFound(false);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      console.log('Debounced search triggered for:', email);
      // Always search when email changes, don't skip if customer was found before
      if (email && email.includes('@')) {
        searchCustomerByEmail(email);
      }
    }, 800); // Increased delay to 800ms for better UX

    return () => {
      console.log('Clearing timeout for email search');
      clearTimeout(timeoutId);
    };
  }, [watch('customerEmail'), searchCustomerByEmail, initialData?.id]);

  // Reset customer found status when email is cleared or changed significantly
  useEffect(() => {
    const email = watch('customerEmail');
    if (!email || email.length < 3) {
      setCustomerFound(false);
    }
  }, [watch('customerEmail')]);



















  // Load staff options
  useEffect(() => {
    const loadStaff = async () => {
      try {
        // Use Supabase to get only store employees from profiles table
        const { data: staff, error } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, role')
          .eq('role', 'store_employee');

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
        // Fallback: set empty array if no store employees found
        setStaffOptions([]);
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

  const handleOrderSubmit = handleSubmit(
    (data) => {
      console.log('Form validation passed, data:', data);
      if (lines.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please add at least one item to the order',
          variant: 'destructive'
        });
        return;
      }
      handleSave(data, 'submitted');
    },
    (errors) => {
      console.log('Form validation failed, errors:', errors);
      let message = 'Please fill in all required fields.';
      if (errors.customerEmail || errors.firstName || errors.lastName || errors.customerPhone) {
        message = 'Please fill in all required customer information (Email, First Name, Last Name, Phone)';
      } else if (errors.fulfillmentType) {
        message = 'Please choose pick-up or delivery';
      } else if (errors.street || errors.city || errors.state || errors.zipcode || errors.country) {
        message = 'Please fill in all required address fields for delivery';
      }
      toast({
        title: 'Validation Error',
        description: message,
        variant: 'destructive'
      });
    }
  );

  // Alternative manual validation function as backup
  const handleOrderSubmitManual = () => {
    console.log('Manual submit clicked');
    const currentValues = getValues();
    console.log('Current form values:', currentValues);
    
    // Manual validation check
    if (!currentValues.customerEmail || !currentValues.firstName || !currentValues.lastName || !currentValues.customerPhone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required customer information (Email, First Name, Last Name, Phone)',
        variant: 'destructive'
      });
      return;
    }
    
    if (!currentValues.fulfillmentType) {
      toast({
        title: 'Validation Error',
        description: 'Please choose pick-up or delivery',
        variant: 'destructive'
      });
      return;
    }
    
    if (currentValues.fulfillmentType === 'delivery') {
      if (!currentValues.street || !currentValues.city || !currentValues.state || !currentValues.country || !currentValues.zipcode) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required address fields for delivery',
          variant: 'destructive'
        });
        return;
      }
    }
    
    if (lines.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one item to the order',
        variant: 'destructive'
      });
      return;
    }
    
    // If all validations pass, call handleSubmit
    handleSubmit((data) => handleSave(data, 'submitted'))();
  };

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
              <Label>Store Invoice#</Label>
              <Input
                type="text"
                value={watch('storeInvoiceNumber') || ''}
                onChange={(e) => setValue('storeInvoiceNumber', e.target.value)}
                placeholder="Enter custom invoice number..."
                disabled={readOnly}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Create a custom invoice number for your store records
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
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
              <Label>Payment Methods (Max 3)</Label>
              <PaymentMethodsSection 
                control={control}
                watch={watch}
                setValue={setValue}
                readOnly={readOnly}
                totals={totals}
              />
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
                  {/* Physical & Direct */}
                  <SelectItem value="storefront">Storefront Walk-in</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="email">Email Inquiry</SelectItem>
                  
                  {/* Social Media */}
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  
                  {/* Digital Marketing */}
                  <SelectItem value="website">Company Website</SelectItem>
                  <SelectItem value="google-search">Google Search</SelectItem>
                  <SelectItem value="google-ads">Google Ads</SelectItem>
                  <SelectItem value="online-marketplace">Online Marketplace</SelectItem>
                  <SelectItem value="email-marketing">Email Marketing</SelectItem>
                  
                  {/* Word of Mouth */}
                  <SelectItem value="referral-friend">Friend/Family Referral</SelectItem>
                  <SelectItem value="referral-customer">Customer Referral</SelectItem>
                  <SelectItem value="referral-employee">Employee Referral</SelectItem>
                  
                  {/* Traditional Marketing */}
                  <SelectItem value="print-ad">Print Advertisement</SelectItem>
                  <SelectItem value="radio">Radio</SelectItem>
                  <SelectItem value="tv">Television</SelectItem>
                  <SelectItem value="billboard">Billboard/Outdoor</SelectItem>
                  <SelectItem value="direct-mail">Direct Mail</SelectItem>
                  
                  {/* Events & Partnerships */}
                  <SelectItem value="trade-show">Trade Show/Event</SelectItem>
                  <SelectItem value="partnership">Business Partnership</SelectItem>
                  <SelectItem value="affiliate">Affiliate/Reseller</SelectItem>
                  
                  {/* Other */}
                  <SelectItem value="repeat-customer">Repeat Customer</SelectItem>
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
            onClick={handleOrderSubmitManual}
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