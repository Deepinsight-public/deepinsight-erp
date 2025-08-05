import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
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
  
  const { register, handleSubmit, watch, setValue, getValues } = useForm<SalesOrderDTO & CustomerInfo & {
    orderType: 'retail' | 'wholesale';
    fulfillmentType: 'walk-in' | 'delivery';
    paymentMethod: string;
    paymentNote: string;
    customerSource: string;
    cashierId: string;
    warrantyYears: number;
    warrantyAmount: number;
    accessory: string;
    otherServices: string;
    otherFee: number;
  }>({
    defaultValues: {
      orderDate: initialData?.orderDate || new Date().toISOString().split('T')[0],
      orderType: initialData?.orderType || 'retail',
      fulfillmentType: initialData?.walkInDelivery as 'walk-in' | 'delivery' || 'walk-in',
      customerName: initialData?.customerName || '',
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
      otherFee: initialData?.otherFee || 0,
      status: initialData?.status || 'draft',
      ...initialData
    }
  });

  // Calculate totals
  const calculateTotals = (orderLines: SalesOrderLineDTO[]) => {
    const subTotal = orderLines.reduce((sum, line) => sum + line.subTotal, 0);
    const discountAmount = orderLines.reduce((sum, line) => 
      sum + (line.unitPrice * line.quantity * line.discountPercent / 100), 0
    );
    const taxAmount = (subTotal - discountAmount) * 0.1; // 10% tax
    const totalAmount = subTotal - discountAmount + taxAmount;

    return { subTotal, discountAmount, taxAmount, totalAmount };
  };

  const totals = calculateTotals(lines);

  // Add new line item
  const handleAddItem = async (productId: string, quantity: number) => {
    try {
      const product = productOptions.find(p => p.id === productId);
      if (!product) return;

      const stockLevel = await fetchStockLevel(product.sku);
      if (quantity > stockLevel.availableStock) {
        toast({
          title: 'Error',
          description: `Not enough stock. Available: ${stockLevel.availableStock}`,
          variant: 'destructive'
        });
        return;
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
        description: 'Failed to add item',
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
  const handleSave = async (status: 'draft' | 'submitted') => {
    setLoading(true);
    try {
      const formData = getValues();
      
      // Get user profile for store_id and user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.store_id) throw new Error('User profile not found');

      // Prepare order data for database
      const orderData = {
        order_number: initialData?.orderNumber || `ORD-${Date.now()}`,
        customer_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        customer_first: formData.firstName,
        customer_last: formData.lastName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        addr_country: formData.country,
        addr_state: formData.state,
        addr_city: formData.city,
        addr_street: formData.street,
        addr_zipcode: formData.zipcode,
        warranty_years: formData.warrantyYears || 1,
        warranty_amount: formData.warrantyAmount || 0,
        walk_in_delivery: formData.fulfillmentType || 'walk-in',
        accessory: formData.accessory,
        other_services: formData.otherServices,
        other_fee: formData.otherFee || 0,
        payment_method: formData.paymentMethod,
        payment_note: formData.paymentNote,
        customer_source: formData.customerSource,
        total_amount: totals.totalAmount,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        status,
        order_date: new Date().toISOString(),
        store_id: profile.store_id,
        created_by: user.id,
        cashier_id: formData.cashierId || user.id
      };

      let savedOrder;
      if (initialData?.id) {
        // Update existing order
        const { data: updatedOrder, error } = await supabase
          .from('sales_orders')
          .update(orderData)
          .eq('id', initialData.id)
          .select()
          .single();

        if (error) throw error;
        savedOrder = updatedOrder;
      } else {
        // Create new order
        const { data: newOrder, error } = await supabase
          .from('sales_orders')
          .insert({ id: crypto.randomUUID(), ...orderData })
          .select()
          .single();

        if (error) throw error;
        savedOrder = newOrder;
      }

      // Save/update line items
      if (lines.length > 0) {
        // Delete existing line items if updating
        if (initialData?.id) {
          await supabase
            .from('sales_order_items')
            .delete()
            .eq('sales_order_id', initialData.id);
        }

        // Insert new line items
        const lineItemsData = lines.map(item => ({
          sales_order_id: savedOrder.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.unitPrice * item.quantity * item.discountPercent / 100,
          total_amount: item.subTotal
        }));

        const { error: lineItemsError } = await supabase
          .from('sales_order_items')
          .insert(lineItemsData);

        if (lineItemsError) throw lineItemsError;
      }

      // Save customer information to customers table if new customer
      if (formData.customerEmail && !customerFound) {
        try {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', formData.customerEmail)
            .single();

          if (!existingCustomer) {
            const customerData = {
              store_id: profile.store_id,
              name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
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

            await supabase
              .from('customers')
              .insert(customerData);
          }
        } catch (customerError) {
          console.warn('Error saving customer:', customerError);
        }
      }

      // Convert to DTO format for callback
      const orderDTO: SalesOrderDTO = {
        id: savedOrder.id,
        orderNumber: savedOrder.order_number,
        customerName: savedOrder.customer_name,
        customerEmail: savedOrder.customer_email,
        customerPhone: savedOrder.customer_phone,
        customerFirst: savedOrder.customer_first,
        customerLast: savedOrder.customer_last,
        addrCountry: savedOrder.addr_country,
        addrState: savedOrder.addr_state,
        addrCity: savedOrder.addr_city,
        addrStreet: savedOrder.addr_street,
        addrZipcode: savedOrder.addr_zipcode,
        warrantyYears: savedOrder.warranty_years,
        warrantyAmount: savedOrder.warranty_amount,
        walkInDelivery: savedOrder.walk_in_delivery,
        accessory: savedOrder.accessory,
        otherServices: savedOrder.other_services,
        otherFee: savedOrder.other_fee,
        paymentMethod: savedOrder.payment_method,
        paymentNote: savedOrder.payment_note,
        customerSource: savedOrder.customer_source,
        cashierId: savedOrder.cashier_id,
        totalAmount: savedOrder.total_amount,
        discountAmount: savedOrder.discount_amount,
        taxAmount: savedOrder.tax_amount,
        status: savedOrder.status,
        orderDate: savedOrder.order_date,
        lines,
        subTotal: totals.subTotal,
        orderType: 'retail', // Default value
        createdAt: savedOrder.created_at,
        updatedAt: savedOrder.updated_at,
        createdBy: savedOrder.created_by,
        storeId: savedOrder.store_id
      };

      toast({
        title: 'Success',
        description: `Order ${status === 'draft' ? 'saved as draft' : 'submitted'} successfully`
      });
      
      onSave?.(orderDTO);
    } catch (error) {
      console.error('Error saving sales order:', error);
      toast({
        title: 'Error',
        description: `Failed to save order: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        
        // Parse customer name from name field
        const nameParts = customer.name ? customer.name.split(' ') : [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        console.log("Found customer:", customer);
        console.log("Name parts:", nameParts);
        
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

  // Debounced email search
  useEffect(() => {
    const email = watch('customerEmail');
    const timeoutId = setTimeout(() => {
      if (email && !customerFound) {
        searchCustomerByEmail(email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch('customerEmail'), searchCustomerByEmail, customerFound]);

  // Load staff options
  useEffect(() => {
    const loadStaff = async () => {
      try {
        // Use Supabase to get staff from profiles table
        const { data: staff, error } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .not('full_name', 'is', null);

        if (error) {
          throw error;
        }

        const staffOptions = staff?.map(s => ({
          id: s.user_id,
          name: s.full_name || 'Unknown'
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
    console.log('Product search called with:', search);
    if (search.length < 2) {
      console.log('Search too short, clearing options');
      setProductOptions([]);
      return;
    }
    
    try {
      const products = await fetchProductLookup(search);
      console.log('Fetched products:', products);
      setProductOptions(products);
    } catch (error) {
      console.error('Product search failed:', error);
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
              <Label htmlFor="customerEmail">Email (lookup key) *</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                disabled={readOnly}
                placeholder="customer@example.com"
                className={cn(customerFound && "border-success")}
              />
              {isSearchingCustomer && (
                <p className="text-xs text-muted-foreground mt-1">Searching customer...</p>
              )}
              {customerFound && (
                <p className="text-xs text-success mt-1">Customer found and details auto-filled</p>
              )}
            </div>
            <div />
            
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                {...register('customerPhone')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
            <div />
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...register('state')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
            
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
            <div>
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                {...register('street')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
            
            <div>
              <Label htmlFor="zipcode">Zipcode</Label>
              <Input
                id="zipcode"
                {...register('zipcode')}
                disabled={readOnly || customerFound}
                placeholder=""
              />
            </div>
          </div>
        </div>

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
              <Label>Walk-in / Delivery</Label>
              <RadioGroup
                value={watch('fulfillmentType')}
                onValueChange={(value) => setValue('fulfillmentType', value as 'walk-in' | 'delivery')}
                disabled={readOnly}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="walk-in" id="walk-in" />
                  <Label htmlFor="walk-in">Walk-in</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
              </RadioGroup>
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
                {...register('accessory', { valueAsNumber: true })}
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
            <span>Sub-total:</span>
            <span>${totals.subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-${totals.discountAmount.toFixed(2)}</span>
          </div>
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
            onClick={() => handleSave('draft')}
            disabled={loading}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('submitted')}
            disabled={loading || lines.length === 0}
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

  // Load sample products when dialog opens
  useEffect(() => {
    if (open && productOptions.length === 0) {
      console.log('Dialog opened, loading initial products');
      onProductSearch('冰箱'); // Search for 冰箱 to show sample products
    }
  }, [open, productOptions.length, onProductSearch]);

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
              label: `${p.sku} - ${p.productName} ($${p.price.toFixed(2)}) - Stock: ${p.availableStock}`
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
              return (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium truncate flex-1">{product.sku} – {product.productName}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                    <span>•</span>
                    <span>Stock: {product.availableStock}</span>
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
          />
        </div>
      </div>
    </FormDialog>
  );
}