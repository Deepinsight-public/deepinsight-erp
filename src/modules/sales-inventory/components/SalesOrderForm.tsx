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
import { Checkbox } from '@/components/ui/checkbox';
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
                type="text"
                value={paymentMethod.amount || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow numbers, decimal point, and empty string
                  if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                    const amount = parseFloat(newValue) || 0;
                    const maxAmount = remainingAmount + (paymentMethod.amount || 0);
                    if (amount <= maxAmount || newValue === '') {
                      updatePaymentMethod(index, 'amount', amount);
                    }
                  }
                }}
                disabled={readOnly}
                className="h-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
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
  deliveryDate: z.string().optional(),
  customerPhone: z.string().min(1, 'Phone number is required'),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  zipcode: z.string().optional(),
  actualDeliveryDate: z.string().optional(),
  warrantyYears: z.number().min(0).optional(),
  warrantyAmount: z.number().min(0).optional(),
  accessory: z.string().optional(),
  otherFee: z.number().min(0).optional(),
  otherServices: z.string().optional(),
  deliveryFee: z.number().min(0).optional(),
      paymentMethods: z.array(z.object({
      method: z.string(),
      amount: z.number().min(0),
      note: z.string().optional()
    })).max(3, "Maximum 3 payment methods allowed").optional(),
  paymentNote: z.string().optional(),
  customerSource: z.string().optional(),
  cashierId: z.string().optional(),
  orderDate: z.string().optional(),
  storeInvoiceNumber: z.string().optional(),
  presale: z.boolean().optional(),
  // Tax Settings
  separateTaxRates: z.boolean().optional(),
  uniformTaxRate: z.number().min(0).max(100).optional(),
  servicesTaxRate: z.number().min(0).max(100).optional(),
  warrantyTaxRate: z.number().min(0).max(100).optional(),
  accessoryTaxRate: z.number().min(0).max(100).optional(),
  deliveryTaxRate: z.number().min(0).max(100).optional(),
  otherFeeTaxRate: z.number().min(0).max(100).optional()
}).refine((data) => {
  // If delivery is selected, address fields and delivery date are required
  if (data.fulfillmentType === 'delivery') {
    return !!(data.street && data.city && data.state && data.country && data.zipcode && data.deliveryDate);
  }
  return true;
}, {
  message: "Address fields and delivery date are required for delivery orders",
  path: ["fulfillmentType"]
});

type SalesOrderFormData = z.infer<typeof SalesOrderFormSchema>;

interface SalesOrderFormProps {
  initialData?: SalesOrderDTO;
  onSave?: (order: SalesOrderDTO) => void;
  onCancel?: () => void;
  onFormChange?: (hasChanges: boolean) => void;
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

export function SalesOrderForm({ initialData, onSave, onCancel, onFormChange, readOnly = false }: SalesOrderFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<ProductLookupItem[]>([]);
  const [lines, setLines] = useState<SalesOrderLineDTO[]>(initialData?.lines || []);
  const [staffOptions, setStaffOptions] = useState<StaffMember[]>([]);
  const [customerFound, setCustomerFound] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  
  const { register, handleSubmit, watch, setValue, getValues, control, formState: { errors }, reset } = useForm<SalesOrderFormData>({
    resolver: zodResolver(SalesOrderFormSchema),
    defaultValues: {
      orderDate: initialData?.orderDate || new Date().toISOString().split('T')[0],
      fulfillmentType: (initialData?.walkInDelivery === 'walk-in' ? 'pick-up' : initialData?.walkInDelivery as 'pick-up' | 'delivery') || undefined,
      deliveryDate: initialData?.deliveryDate || '',
      actualDeliveryDate: initialData?.actualDeliveryDate || '',
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
      presale: initialData?.presale || false,
      warrantyYears: initialData?.warrantyYears || 1,
      warrantyAmount: initialData?.warrantyAmount || 0,
      accessory: initialData?.accessory || '',
      otherServices: initialData?.otherServices || '',
      otherFee: initialData?.otherFee || 0,
      deliveryFee: (initialData as any)?.deliveryFee || 0,
      // Tax Settings
      separateTaxRates: (initialData as any)?.separateTaxRates || false,
      uniformTaxRate: (initialData as any)?.uniformTaxRate || 10,
      servicesTaxRate: (initialData as any)?.servicesTaxRate || 10,
      warrantyTaxRate: (initialData as any)?.warrantyTaxRate || 10,
      accessoryTaxRate: (initialData as any)?.accessoryTaxRate || 10,
      deliveryTaxRate: (initialData as any)?.deliveryTaxRate || 10,
      otherFeeTaxRate: (initialData as any)?.otherFeeTaxRate || 10
    }
  });

  // Reset form when initialData changes (important for cancel edit functionality)
  useEffect(() => {
    if (initialData) {
      const resetValues = {
        orderDate: initialData.orderDate || new Date().toISOString().split('T')[0],
        fulfillmentType: (initialData.walkInDelivery === 'walk-in' ? 'pick-up' : initialData.walkInDelivery as 'pick-up' | 'delivery') || undefined,
        deliveryDate: initialData.deliveryDate || '',
        actualDeliveryDate: initialData.actualDeliveryDate || '',
        customerEmail: initialData.customerEmail || '',
        firstName: initialData.customerFirst || '',
        lastName: initialData.customerLast || '',
        customerPhone: initialData.customerPhone || '',
        country: initialData.addrCountry || '',
        state: initialData.addrState || '',
        city: initialData.addrCity || '',
        street: initialData.addrStreet || '',
        zipcode: initialData.addrZipcode || '',
        paymentMethods: initialData.paymentMethods || [{ method: '', amount: 0, note: '' }],
        paymentNote: initialData.paymentNote || '',
        customerSource: initialData.customerSource || '',
        cashierId: initialData.cashierId || '',
        storeInvoiceNumber: initialData.storeInvoiceNumber || '',
        presale: initialData.presale || false,
        warrantyYears: initialData.warrantyYears || 1,
        warrantyAmount: initialData.warrantyAmount || 0,
        accessory: initialData.accessory || '',
        otherServices: initialData.otherServices || '',
        otherFee: initialData.otherFee || 0,
        deliveryFee: (initialData as any)?.deliveryFee || 0,
        // Tax Settings
        separateTaxRates: (initialData as any)?.separateTaxRates || false,
        uniformTaxRate: (initialData as any)?.uniformTaxRate || 10,
        servicesTaxRate: (initialData as any)?.servicesTaxRate || 10,
        warrantyTaxRate: (initialData as any)?.warrantyTaxRate || 10,
        accessoryTaxRate: (initialData as any)?.accessoryTaxRate || 10,
        deliveryTaxRate: (initialData as any)?.deliveryTaxRate || 10,
        otherFeeTaxRate: (initialData as any)?.otherFeeTaxRate || 10
      };
      
      reset(resetValues);
      setLines(initialData.lines || []);
    }
  }, [initialData, reset]);

  // Calculate totals including fees with dynamic tax rates
  const calculateTotals = (
    orderLines: SalesOrderLineDTO[], 
    warrantyAmount?: number, 
    accessoryFee?: number, 
    deliveryFee?: number,
    otherFee?: number, 
    separateTaxRates = false,
    uniformTaxRate = 10,
    servicesTaxRate = 10,
    warrantyTaxRate = 10,
    accessoryTaxRate = 10,
    deliveryTaxRate = 10,
    otherFeeTaxRate = 10
  ) => {
    const linesSum = orderLines.reduce((sum, line) => sum + line.subTotal, 0);
    const linesDiscount = orderLines.reduce((sum, line) => 
      sum + (line.unitPrice * line.quantity * line.discountPercent / 100), 0
    );
    const linesSubTotal = linesSum - linesDiscount;
    
    const warranty = warrantyAmount ?? 0;
    const accessory = accessoryFee ?? 0;
    const delivery = deliveryFee ?? 0;
    const other = otherFee ?? 0;
    
    let taxAmount = 0;
    let servicesTax = 0;
    let productWarrantyTax = 0;
    let accessoryTax = 0;
    let deliveryTax = 0;
    let otherTax = 0;
    

    
    if (separateTaxRates) {
      // Calculate tax separately for each component
      // Services Tax is separate from Product & Warranty Tax
      servicesTax = 0; // Set to 0 to avoid double taxation - products are included in productWarrantyTax
      productWarrantyTax = (linesSubTotal + warranty) * (warrantyTaxRate / 100); // Combined Product & Warranty Tax as requested
      accessoryTax = accessory * (accessoryTaxRate / 100);
      deliveryTax = delivery * (deliveryTaxRate / 100);
      otherTax = other * (otherFeeTaxRate / 100);
      taxAmount = servicesTax + productWarrantyTax + accessoryTax + deliveryTax + otherTax;
    } else {
      // Use uniform tax rate for all components
      const subTotal = linesSubTotal + warranty + accessory + delivery + other;
      taxAmount = subTotal * (uniformTaxRate / 100);
    }
    
    const grandTotal = linesSubTotal + warranty + accessory + delivery + other + taxAmount;
    
    return { 
      subTotal: linesSubTotal, 
      discountAmount: linesDiscount, 
      taxAmount, 
      totalAmount: grandTotal,
      extrasTotal: warranty + accessory + delivery + other,
      // Additional breakdown for separate tax rates
      servicesTax: servicesTax,
      productWarrantyTax: productWarrantyTax,
      warrantyTax: 0, // Deprecated - now part of productWarrantyTax
      accessoryTax: accessoryTax,
      deliveryTax: deliveryTax,
      otherTax: otherTax
    };
  };

  const totals = calculateTotals(
    lines, 
    Number(watch('warrantyAmount')) || 0, 
    parseFloat(watch('accessory') || '0'), 
    Number(watch('deliveryFee')) || 0,
    Number(watch('otherFee')) || 0,
    watch('separateTaxRates'),
    Number(watch('uniformTaxRate')) || 10,
    Number(watch('servicesTaxRate')) || 10,
    Number(watch('warrantyTaxRate')) || 10,
    Number(watch('accessoryTaxRate')) || 10,
    Number(watch('deliveryTaxRate')) || 10,
    Number(watch('otherFeeTaxRate')) || 10
  );


  // Add new line item
  const handleAddItem = async (productId: string, quantity: number) => {
    try {
      // Find product details
      const product = productOptions.find(p => p.id === productId);
      if (!product) {
        throw new Error(t('salesOrder.errors.productNotFound'));
      }

      // Check if item already exists
      const existingLineIndex = lines.findIndex(line => line.productId === productId);
      if (existingLineIndex !== -1) {
        throw new Error(t('salesOrder.errors.productAlreadyAdded'));
      }

      // Check stock availability (client-side validation)
      if (product.availableStock < quantity) {
        throw new Error(t('salesOrder.errors.insufficientStock', { available: product.availableStock }));
      }

      // Check MAP price validation for new products
      if (product.isNew && product.mapPrice && product.price < product.mapPrice) {
        throw new Error(`Price of $${product.price.toFixed(2)} is below MAP price of $${product.mapPrice.toFixed(2)} for new product "${product.productName}"`);
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
        
        // Check MAP price validation for new products
        if (updates.unitPrice !== undefined) {
          const product = productOptions.find(p => p.id === line.productId);
          if (product?.isNew && product?.mapPrice && updates.unitPrice < product.mapPrice) {
            toast({
              title: 'MAP Price Violation',
              description: `Price cannot be below MAP price of $${product.mapPrice.toFixed(2)} for new product "${product.productName}"`,
              variant: 'destructive'
            });
            // Don't update the price, keep the original
            updated.unitPrice = line.unitPrice;
          }
        }
        
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
        deliveryDate: formData.deliveryDate || null,
        actualDeliveryDate: formData.actualDeliveryDate || null,
        accessory: formData.accessory || '',
        otherServices: formData.otherServices,
        otherFee: formData.otherFee || 0,
        deliveryFee: formData.deliveryFee || 0,
        paymentMethod: formData.paymentMethods?.[0]?.method || null,
        paymentMethods: formData.paymentMethods || [],
        paymentNote: formData.paymentNote,
        customerSource: formData.customerSource,
        storeInvoiceNumber: formData.storeInvoiceNumber || `INV-${Date.now()}`,
        presale: formData.presale || false,
        // Tax Settings
        separateTaxRates: formData.separateTaxRates || false,
        uniformTaxRate: formData.uniformTaxRate || 10,
        servicesTaxRate: formData.servicesTaxRate || 10,
        warrantyTaxRate: formData.warrantyTaxRate || 10,
        accessoryTaxRate: formData.accessoryTaxRate || 10,
        deliveryTaxRate: formData.deliveryTaxRate || 10,
        otherFeeTaxRate: formData.otherFeeTaxRate || 10,
        totalAmount: totals.totalAmount,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        subTotal: totals.subTotal,
        status,
        orderDate: initialData?.id ? (initialData.orderDate || formData.orderDate) : new Date().toISOString(),
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
      if (formData.customerEmail && formData.firstName && formData.lastName) {

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



          if (existingCustomer) {
            // Update existing customer

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
            

            toast({
              title: 'Customer Updated',
              description: `Updated details for ${customerData.first_name} ${customerData.last_name}`,
              variant: 'default'
            });
          } else {
            // Create new customer - try using CRM module approach

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

      }
      


      toast({
        title: 'Success',
        description: `Order ${status === 'draft' ? 'saved as draft' : 'submitted'} successfully`
      });
      
      // Refresh product list to update stock levels after order submission
      if (status === 'submitted') {

        handleProductSearch('');
      }
      
      onSave?.(savedOrder);
    } catch (error) {
      console.error('Error saving sales order:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('INSUFFICIENT_STOCK')) {
          // Extract SKU from error message
          const match = error.message.match(/INSUFFICIENT_STOCK: (.+)/);
          errorMessage = match ? match[1] : t('salesOrder.errors.insufficientStockGeneric');
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle Supabase errors and other object errors
        if (error.message) {
          errorMessage = error.message;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        } else if (error.code) {
          errorMessage = `Database error: ${error.code}`;
        } else {
          errorMessage = 'Database or validation error occurred';
        }
      } else {
        errorMessage = `Unexpected error type: ${typeof error}`;
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {

      setCustomerFound(false);
      return;
    }


    setIsSearchingCustomer(true);
    
    try {
      // Get current user's store_id for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {

        setCustomerFound(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.store_id) {

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



      if (error) {
        throw error;
      }

      if (customers && customers.length > 0) {
        const customer = customers[0];
        setCustomerFound(true);
        
        // Use separate name fields from customer record
        const firstName = customer.first_name || '';
        const lastName = customer.last_name || '';


        
        // Auto-fill form fields with customer data
        setValue('firstName', firstName);
        setValue('lastName', lastName);
        setValue('customerPhone', customer.phone || '');
        
        // Auto-fill address if available - improved parsing
        if (customer.address) {

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

      return;
    }
    
    const email = watch('customerEmail');

    
    if (!email) {
      setCustomerFound(false);
      return;
    }
    
    const timeoutId = setTimeout(() => {

      // Always search when email changes, don't skip if customer was found before
      if (email && email.includes('@')) {
        searchCustomerByEmail(email);
      }
    }, 800); // Increased delay to 800ms for better UX

    return () => {

      clearTimeout(timeoutId);
    };
  }, [watch('customerEmail'), searchCustomerByEmail, initialData?.id]);

  // Track form changes for unsaved changes detection
  useEffect(() => {
    if (onFormChange && initialData) {
      const currentFormData = getValues();
      const hasChanges = (
        // Customer information
        currentFormData.customerEmail !== (initialData.customerEmail || '') ||
        currentFormData.firstName !== (initialData.customerFirst || '') ||
        currentFormData.lastName !== (initialData.customerLast || '') ||
        currentFormData.customerPhone !== (initialData.customerPhone || '') ||
        // Address fields
        currentFormData.country !== (initialData.addrCountry || '') ||
        currentFormData.state !== (initialData.addrState || '') ||
        currentFormData.city !== (initialData.addrCity || '') ||
        currentFormData.street !== (initialData.addrStreet || '') ||
        currentFormData.zipcode !== (initialData.addrZipcode || '') ||
        // Order details
        currentFormData.orderDate !== (initialData.orderDate || new Date().toISOString().split('T')[0]) ||
        currentFormData.fulfillmentType !== (initialData.walkInDelivery === 'walk-in' ? 'pick-up' : initialData.walkInDelivery) ||
        currentFormData.deliveryDate !== (initialData.deliveryDate || '') ||
        currentFormData.actualDeliveryDate !== (initialData.actualDeliveryDate || '') ||
        currentFormData.presale !== (initialData.presale || false) ||
        // Warranty and fees
        currentFormData.warrantyYears !== (initialData.warrantyYears || 1) ||
        currentFormData.warrantyAmount !== (initialData.warrantyAmount || 0) ||
        currentFormData.accessory !== (initialData.accessory || '') ||
        currentFormData.otherServices !== (initialData.otherServices || '') ||
        currentFormData.otherFee !== (initialData.otherFee || 0) ||
        currentFormData.deliveryFee !== ((initialData as any)?.deliveryFee || 0) ||
        // Tax settings
        currentFormData.separateTaxRates !== ((initialData as any)?.separateTaxRates || false) ||
        currentFormData.uniformTaxRate !== ((initialData as any)?.uniformTaxRate || 10) ||
        currentFormData.servicesTaxRate !== ((initialData as any)?.servicesTaxRate || 10) ||
        currentFormData.warrantyTaxRate !== ((initialData as any)?.warrantyTaxRate || 10) ||
        currentFormData.accessoryTaxRate !== ((initialData as any)?.accessoryTaxRate || 10) ||
        currentFormData.deliveryTaxRate !== ((initialData as any)?.deliveryTaxRate || 10) ||
        currentFormData.otherFeeTaxRate !== ((initialData as any)?.otherFeeTaxRate || 10) ||
        // Payment and other details
        currentFormData.paymentNote !== (initialData.paymentNote || '') ||
        currentFormData.customerSource !== (initialData.customerSource || '') ||
        currentFormData.cashierId !== (initialData.cashierId || '') ||
        currentFormData.storeInvoiceNumber !== (initialData.storeInvoiceNumber || '') ||
        JSON.stringify(currentFormData.paymentMethods) !== JSON.stringify(initialData.paymentMethods || [{ method: '', amount: 0, note: '' }]) ||
        JSON.stringify(lines) !== JSON.stringify(initialData.lines || [])
      );
      onFormChange(hasChanges);
    }
  }, [watch(), lines, onFormChange, initialData, getValues]);

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

    
    try {
      const { searchAvailableProducts } = await import('../api/products');
      const products = await searchAvailableProducts(search);

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
      render: (value: string, record: SalesOrderLineDTO) => {
        const product = productOptions.find(p => p.id === record.productId);
        const isNew = product?.isNew || false;
        
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{value}</span>
              {isNew && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                  NEW
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{record.productName}</div>
            {isNew && product?.mapPrice && (
              <div className="text-xs text-orange-600 font-medium">
                MAP: ${product.mapPrice.toFixed(2)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'quantity',
      title: 'Quantity',
      render: (value: number, record: SalesOrderLineDTO) => readOnly ? (
        <span>{value}</span>
      ) : (
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            // Allow only numbers and empty string for typing
            if (newValue === '' || /^\d+$/.test(newValue)) {
              const qty = parseInt(newValue) || 0;
              if (qty >= 1 || newValue === '') {
                handleUpdateLine(record.id!, { quantity: qty });
              }
            }
          }}
          className="w-20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="1"
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
          type="text"
          value={value.toFixed(2)}
          onChange={(e) => {
            const newValue = e.target.value;
            // Allow numbers, decimal point, and empty string
            if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
              const price = parseFloat(newValue) || 0;
              handleUpdateLine(record.id!, { unitPrice: price });
            }
          }}
          className="w-24 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0.00"
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
          type="text"
          value={value.toString()}
          onChange={(e) => {
            const newValue = e.target.value;
            // Allow numbers, decimal point, and empty string
            if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
              const discount = parseFloat(newValue) || 0;
              // Limit to 0-100%
              if (discount <= 100 || newValue === '') {
                handleUpdateLine(record.id!, { discountPercent: discount });
              }
            }
          }}
          className="w-20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
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

      if (lines.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please add at least one item to the order',
          variant: 'destructive'
        });
        return;
      }
      
      // Validate MAP price restrictions for new products before submission
      for (const line of lines) {
        const product = productOptions.find(p => p.id === line.productId);
        if (product?.isNew && product?.mapPrice && line.unitPrice < product.mapPrice) {
          toast({
            title: 'MAP Price Violation',
            description: `Cannot submit order: "${product.productName}" unit price $${line.unitPrice.toFixed(2)} is below MAP price $${product.mapPrice.toFixed(2)}`,
            variant: 'destructive'
          });
          return;
        }
      }
      
      handleSave(data, 'submitted');
    },
    (errors) => {

      let message = 'Please fill in all required fields.';
      if (errors.customerEmail || errors.firstName || errors.lastName || errors.customerPhone) {
        message = 'Please fill in all required customer information (Email, First Name, Last Name, Phone)';
      } else if (errors.fulfillmentType) {
        message = 'Please choose pick-up or delivery';
      } else if (errors.street || errors.city || errors.state || errors.zipcode || errors.country || errors.deliveryDate) {
        message = 'Please fill in all required address fields and delivery date for delivery';
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

    const currentValues = getValues();

    
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
      if (!currentValues.street || !currentValues.city || !currentValues.state || !currentValues.country || !currentValues.zipcode || !currentValues.deliveryDate) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required address fields and delivery date for delivery',
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
    
    // Validate MAP price restrictions for new products before submission
    for (const line of lines) {
      const product = productOptions.find(p => p.id === line.productId);
      if (product?.isNew && product?.mapPrice && line.unitPrice < product.mapPrice) {
        toast({
          title: 'MAP Price Violation',
          description: `Cannot submit order: "${product.productName}" unit price $${line.unitPrice.toFixed(2)} is below MAP price $${product.mapPrice.toFixed(2)}`,
          variant: 'destructive'
        });
        return;
      }
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
            
            <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
              <Checkbox
                id="presale"
                checked={watch('presale') || false}
                onCheckedChange={(checked) => setValue('presale', checked as boolean)}
                disabled={readOnly}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div>
                <Label htmlFor="presale" className="text-base font-medium cursor-pointer">
                  Presale Order
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark this order as a presale for special handling
                </p>
              </div>
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

            {/* Estimated Delivery Date - Only show for delivery */}
            {watch('fulfillmentType') === 'delivery' && (
              <div>
                <Label>Estimated Delivery Date <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-64 justify-start text-left font-normal",
                        !watch('deliveryDate') && "text-muted-foreground"
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch('deliveryDate') ? format(new Date(watch('deliveryDate')), 'PPP') : <span>Pick an estimated delivery date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch('deliveryDate') ? new Date(watch('deliveryDate')) : undefined}
                      onSelect={(date) => setValue('deliveryDate', date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                {watch('fulfillmentType') === 'delivery' && !watch('deliveryDate') && !readOnly && (
                  <p className="text-xs text-destructive mt-1">Estimated delivery date is required for delivery orders</p>
                )}
              </div>
            )}

            {/* Actual Delivery Date - Only show for delivery */}
            {watch('fulfillmentType') === 'delivery' && (
              <div>
                <Label>Actual Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-64 justify-start text-left font-normal",
                        !watch('actualDeliveryDate') && "text-muted-foreground"
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch('actualDeliveryDate') ? format(new Date(watch('actualDeliveryDate')), 'PPP') : <span>Pick actual delivery date (optional)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch('actualDeliveryDate') ? new Date(watch('actualDeliveryDate')) : undefined}
                      onSelect={(date) => setValue('actualDeliveryDate', date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            {/* Order Items moved here */}
            <div className="col-span-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Order Items</h3>
                {!readOnly && (
                  <Button onClick={() => setShowAddItemDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                )}
              </div>
              <div className="border rounded-lg">
                <DataTable
                  data={lines}
                  columns={lineColumns}
                />
              </div>
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
                type="text"
                value={watch('warrantyYears') || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow only positive integers
                  if (newValue === '' || /^\d+$/.test(newValue)) {
                    const years = parseInt(newValue) || 0;
                    if (years >= 0 || newValue === '') {
                      setValue('warrantyYears', years);
                    }
                  }
                }}
                disabled={readOnly}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="1"
              />
            </div>
            
            <div>
              <Label htmlFor="warrantyAmount">Warranty Amount ($)</Label>
              <Input
                id="warrantyAmount"
                type="text"
                value={watch('warrantyAmount') || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow numbers, decimal point, and empty string
                  if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                    const amount = parseFloat(newValue) || 0;
                    if (amount >= 0 || newValue === '') {
                      setValue('warrantyAmount', amount);
                    }
                  }
                }}
                disabled={readOnly}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="accessory">Accessory Fee ($)</Label>
              <Input
                id="accessory"
                type="text"
                value={watch('accessory') || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow numbers, decimal point, and empty string
                  if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                    const amount = parseFloat(newValue) || 0;
                    if (amount >= 0 || newValue === '') {
                      setValue('accessory', newValue === '' ? '' : amount.toString());
                    }
                  }
                }}
                disabled={readOnly}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
              <Input
                id="deliveryFee"
                type="text"
                value={watch('deliveryFee') || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow numbers, decimal point, and empty string
                  if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                    const amount = parseFloat(newValue) || 0;
                    if (amount >= 0 || newValue === '') {
                      setValue('deliveryFee', amount);
                    }
                  }
                }}
                disabled={readOnly}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="otherFee">Other Fee ($)</Label>
              <Input
                id="otherFee"
                type="text"
                value={watch('otherFee') || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow numbers, decimal point, and empty string
                  if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                    const amount = parseFloat(newValue) || 0;
                    if (amount >= 0 || newValue === '') {
                      setValue('otherFee', amount);
                    }
                  }
                }}
                disabled={readOnly}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Tax Settings</h2>
          
          {/* Tax Mode Toggle */}
          <div className="mb-4">
            <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
              <Checkbox
                id="separateTaxRates"
                checked={watch('separateTaxRates') || false}
                onCheckedChange={(checked) => setValue('separateTaxRates', checked as boolean)}
                disabled={readOnly}
                className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <div>
                <Label htmlFor="separateTaxRates" className="text-base font-medium cursor-pointer">
                  Use Separate Tax Rates for Each Fee
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, you can set different tax rates for items, warranty, accessory, and other fees
                </p>
              </div>
            </div>
          </div>

          {/* Tax Rate Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!watch('separateTaxRates') ? (
              // Uniform Tax Rate
              <div className="md:col-span-2">
                <Label htmlFor="uniformTaxRate">Uniform Tax Rate (%)</Label>
                <Input
                  id="uniformTaxRate"
                  type="text"
                  value={watch('uniformTaxRate') || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                      const rate = parseFloat(newValue) || 0;
                      if (rate >= 0 && rate <= 100 || newValue === '') {
                        setValue('uniformTaxRate', rate);
                      }
                    }
                  }}
                  disabled={readOnly}
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none max-w-xs"
                  placeholder="10.0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This tax rate will be applied to all items and fees
                </p>
              </div>
            ) : (
              // Separate Tax Rates
              <>
                <div>
                  <Label htmlFor="servicesTaxRate">Services Tax Rate (%)</Label>
                  <Input
                    id="servicesTaxRate"
                    type="text"
                    value={watch('servicesTaxRate') || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                        const rate = parseFloat(newValue) || 0;
                        if (rate >= 0 && rate <= 100 || newValue === '') {
                          setValue('servicesTaxRate', rate);
                        }
                      }
                    }}
                    disabled={readOnly}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="10.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tax rate for services</p>
                </div>

                <div>
                  <Label htmlFor="warrantyTaxRate">Product & Warranty Tax Rate (%)</Label>
                  <Input
                    id="warrantyTaxRate"
                    type="text"
                    value={watch('warrantyTaxRate') || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                        const rate = parseFloat(newValue) || 0;
                        if (rate >= 0 && rate <= 100 || newValue === '') {
                          setValue('warrantyTaxRate', rate);
                        }
                      }
                    }}
                    disabled={readOnly}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="10.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tax rate for products and warranty (combined)</p>
                </div>

                <div>
                  <Label htmlFor="accessoryTaxRate">Accessory Tax Rate (%)</Label>
                  <Input
                    id="accessoryTaxRate"
                    type="text"
                    value={watch('accessoryTaxRate') || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                        const rate = parseFloat(newValue) || 0;
                        if (rate >= 0 && rate <= 100 || newValue === '') {
                          setValue('accessoryTaxRate', rate);
                        }
                      }
                    }}
                    disabled={readOnly}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="10.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tax rate for accessory fees</p>
                </div>

                <div>
                  <Label htmlFor="deliveryTaxRate">Delivery Tax Rate (%)</Label>
                  <Input
                    id="deliveryTaxRate"
                    type="text"
                    value={watch('deliveryTaxRate') || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                        const rate = parseFloat(newValue) || 0;
                        if (rate >= 0 && rate <= 100 || newValue === '') {
                          setValue('deliveryTaxRate', rate);
                        }
                      }
                    }}
                    disabled={readOnly}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="10.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tax rate for delivery fees</p>
                </div>

                <div>
                  <Label htmlFor="otherFeeTaxRate">Other Fee Tax Rate (%)</Label>
                  <Input
                    id="otherFeeTaxRate"
                    type="text"
                    value={watch('otherFeeTaxRate') || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
                        const rate = parseFloat(newValue) || 0;
                        if (rate >= 0 && rate <= 100 || newValue === '') {
                          setValue('otherFeeTaxRate', rate);
                        }
                      }
                    }}
                    disabled={readOnly}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="10.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tax rate for other fees</p>
                </div>
              </>
            )}
          </div>
        </div>
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
              <span>Extras (Warranty + Accessory + Delivery + Other):</span>
              <span>${totals.extrasTotal.toFixed(2)}</span>
            </div>
          )}
          
          {/* Tax Breakdown */}
          {watch('separateTaxRates') ? (
            // Show separate tax breakdown when enabled
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Tax Breakdown:</div>
              

              
              {totals.servicesTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Services Tax ({watch('servicesTaxRate') || 0}%):</span>
                  <span>${totals.servicesTax.toFixed(2)}</span>
                </div>
              )}
              {totals.productWarrantyTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Product & Warranty Tax ({watch('warrantyTaxRate') || 0}%):</span>
                  <span>${totals.productWarrantyTax.toFixed(2)}</span>
                </div>
              )}
              {totals.accessoryTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Accessory Tax ({watch('accessoryTaxRate') || 0}%):</span>
                  <span>${totals.accessoryTax.toFixed(2)}</span>
                </div>
              )}
              {totals.deliveryTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery Tax ({watch('deliveryTaxRate') || 0}%):</span>
                  <span>${totals.deliveryTax.toFixed(2)}</span>
                </div>
              )}
              {totals.otherTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Other Fee Tax ({watch('otherFeeTaxRate') || 0}%):</span>
                  <span>${totals.otherTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total Tax:</span>
                <span>${totals.taxAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            // Show uniform tax when separate rates are disabled
            <div className="flex justify-between">
              <span>Tax ({watch('uniformTaxRate') || 0}%):</span>
              <span>${totals.taxAmount.toFixed(2)}</span>
            </div>
          )}
          
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
          {initialData?.id ? (
            // Editing existing order - show only Save button
            <Button
              onClick={handleSubmit((data) => handleSave(data, (initialData.status === 'submitted' ? 'submitted' : 'draft')))}
              disabled={loading}
            >
              Save Changes
            </Button>
          ) : (
            // Creating new order - show Save Draft and Submit buttons
            <>
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
            </>
          )}
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
            key={open ? 'dialog-open' : 'dialog-closed'}
            options={(() => {

              const mappedOptions = productOptions.map(p => ({
                value: p.id,
                label: `${p.sku} - ${p.productName} ($${p.price.toFixed(2)}) - Stock: ${p.availableStock}`,
                disabled: p.availableStock === 0
              }));

              return mappedOptions;
            })()}
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
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium truncate">{product.sku} – {product.productName}</span>
                    {product.isNew && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-medium">NEW</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                    {product.isNew && product.mapPrice && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600 font-medium">MAP: ${product.mapPrice.toFixed(2)}</span>
                      </>
                    )}
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
            type="text"
            value={quantity}
            onChange={(e) => {
              const newValue = e.target.value;
              // Allow only numbers and empty string for typing
              if (newValue === '' || /^\d+$/.test(newValue)) {
                const qty = parseInt(newValue) || 1;
                const maxStock = selectedProduct ? productOptions.find(p => p.id === selectedProduct)?.availableStock || 1 : 999;
                if (qty >= 1 && qty <= maxStock) {
                  setQuantity(qty);
                } else if (newValue === '') {
                  setQuantity(1);
                }
              }
            }}
            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="1"
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