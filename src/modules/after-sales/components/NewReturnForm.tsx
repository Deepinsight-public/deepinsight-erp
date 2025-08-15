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
  getCustomerPurchaseHistory,
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
  const [purchaseHistoryProducts, setPurchaseHistoryProducts] = useState<{ 
    value: string; 
    label: string; 
    orderGrandTotal?: number;
    orderNumber?: string;
    purchaseDate?: string;
    itemsInOrder?: number;
    itemPrice?: number;
    actualProductId?: string;
  }[]>([]);
  const [showPurchaseHistoryOnly, setShowPurchaseHistoryOnly] = useState(false);
  const [loadingPurchaseHistory, setLoadingPurchaseHistory] = useState(false);
  const [mapPrice, setMapPrice] = useState<number | null>(null);
  const [showMapPopover, setShowMapPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerAutoFilled, setCustomerAutoFilled] = useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = useState<{
    orderGrandTotal: number;
    orderNumber: string;
    purchaseDate: string;
    itemsInOrder: number;
    itemPrice: number;
  } | null>(null);
  const [selectedDisplayValue, setSelectedDisplayValue] = useState<string>('');

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
      // New fields - optional for backwards compatibility
      status: 'processing',
      selfScraped: false,
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
      // Reset purchase history when email is cleared
      setPurchaseHistoryProducts([]);
      setShowPurchaseHistoryOnly(false);
      setSelectedProductInfo(null);
      setSelectedDisplayValue('');
      return;
    }

    try {
      const customers = await searchCustomersByEmail(email);
      setCustomerSuggestions(customers);
      
      // If email changes, reset purchase history
      if (email !== form.getValues('customerEmail')) {
        setPurchaseHistoryProducts([]);
        setShowPurchaseHistoryOnly(false);
        setSelectedProductInfo(null);
        setSelectedDisplayValue('');
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSelect = async (customer: CustomerLookupResult) => {
    form.setValue('customerEmail', customer.email);
    form.setValue('customerFirst', customer.customerFirst || '');
    form.setValue('customerLast', customer.customerLast || '');
    setCustomerAutoFilled(true);
    setCustomerSuggestions([]);
    
    // Load customer's purchase history for product dropdown
    setLoadingPurchaseHistory(true);
    try {
      const purchaseHistory = await getCustomerPurchaseHistory(customer.email);
      if (purchaseHistory.length > 0) {
        const historyOptions = purchaseHistory.map(order => {
          const invoiceNumber = order.storeInvoiceNumber || order.orderNumber || 'No Invoice';
          const orderDate = order.lastPurchaseDate ? format(new Date(order.lastPurchaseDate), 'MMM dd, yyyy') : 'Unknown';
          const itemsInfo = order.orderItems?.map(item => 
            `${item.sku} - ${item.productName} (Qty: ${item.quantity}, $${item.unitPrice.toFixed(2)})`
          ).join('; ') || 'No items';
          
          const paymentInfo = order.paymentMethods && order.paymentMethods.length > 0 
            ? order.paymentMethods.map(p => `${p.method}: $${p.amount.toFixed(2)}`).join(', ')
            : 'No payment info';
          
          return {
            value: order.id, // Use order ID as value
            label: `Invoice: ${invoiceNumber}`,
            secondaryLabel: `${orderDate} | Total: $${(order.orderGrandTotal || 0).toFixed(2)} | Paid: $${(order.totalPaid || 0).toFixed(2)}`,
            itemsLabel: `Items: ${itemsInfo}`,
            paymentLabel: `Payments: ${paymentInfo}`,
            orderGrandTotal: order.orderGrandTotal,
            orderNumber: order.orderNumber,
            storeInvoiceNumber: order.storeInvoiceNumber,
            purchaseDate: order.lastPurchaseDate,
            itemsInOrder: order.orderItemsCount,
            totalPaid: order.totalPaid,
            balance: order.balance,
            orderItems: order.orderItems,
            actualProductId: order.id, // Store the order ID for form submission
          };
        });
        setPurchaseHistoryProducts(historyOptions);
        setShowPurchaseHistoryOnly(true);
      } else {
        // No purchase history, keep showing all products
        setPurchaseHistoryProducts([]);
        setShowPurchaseHistoryOnly(false);
      }
    } catch (error) {
      console.error('Error loading customer purchase history:', error);
      setShowPurchaseHistoryOnly(false);
    } finally {
      setLoadingPurchaseHistory(false);
    }
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
    // Set the display value for the dropdown
    setSelectedDisplayValue(productId);
    
    // Find and store the selected product's purchase information
    if (showPurchaseHistoryOnly) {
      const selectedProduct = purchaseHistoryProducts.find(p => p.value === productId);
      if (selectedProduct && selectedProduct.orderGrandTotal) {
        // Set the actual product ID for form submission
        form.setValue('productId', selectedProduct.actualProductId || productId);
        
        setSelectedProductInfo({
          orderGrandTotal: selectedProduct.orderGrandTotal,
          orderNumber: selectedProduct.orderNumber || 'N/A',
          purchaseDate: selectedProduct.purchaseDate || 'Unknown',
          itemsInOrder: selectedProduct.itemsInOrder || 1,
          itemPrice: selectedProduct.itemPrice || 0,
        });
        // Pre-fill refund amount with order grand total
        form.setValue('refundAmount', selectedProduct.orderGrandTotal);
        // Set total amount paid to order grand total (if field exists)
        try {
          form.setValue('totalAmountPaid', selectedProduct.orderGrandTotal);
        } catch (error) {
          // Field might not exist yet if database hasn't been migrated
          console.log('totalAmountPaid field not available yet');
        }
      }
    } else {
      // For regular product selection, use the product ID directly
      form.setValue('productId', productId);
      // Clear product info if not from purchase history
      setSelectedProductInfo(null);
    }
    
    try {
      // Use the actual product ID for MAP price lookup
      const actualProductId = showPurchaseHistoryOnly 
        ? purchaseHistoryProducts.find(p => p.value === productId)?.actualProductId || productId
        : productId;
      
      const mapData = await getProductMapPrice(actualProductId);
      setMapPrice(mapData.mapPrice);
      // Set MAP price in form (if field exists)
      try {
        form.setValue('mapPrice', mapData.mapPrice);
      } catch (error) {
        // Field might not exist yet if database hasn't been migrated
        console.log('mapPrice field not available yet');
      }
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
                        placeholder="Select"
                        searchPlaceholder="Search"
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
                      options={showPurchaseHistoryOnly ? purchaseHistoryProducts : productOptions}
                      value={selectedDisplayValue}
                      onValueChange={handleProductSelect}
                      onSearchChange={showPurchaseHistoryOnly ? undefined : handleProductSearch}
                      placeholder={loadingPurchaseHistory ? "Loading purchase history..." : "Select"}
                      searchPlaceholder="Search"
                      emptyText={showPurchaseHistoryOnly ? "No purchase history found." : "No products found."}
                      disabled={loadingPurchaseHistory}
                      className="w-full min-w-[400px]"
                      renderOption={showPurchaseHistoryOnly ? (option: any) => (
                        <div className="w-full space-y-2 py-1">
                          <div className="font-medium text-sm text-blue-700">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.secondaryLabel}</div>
                          <div className="text-xs text-blue-600 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                            {option.itemsLabel?.length > 120 ? `${option.itemsLabel.substring(0, 120)}...` : option.itemsLabel}
                          </div>
                          <div className="text-xs text-green-600">{option.paymentLabel}</div>
                          {option.balance && option.balance > 0 && (
                            <div className="text-xs text-red-600 font-medium">Outstanding Balance: ${option.balance.toFixed(2)}</div>
                          )}
                        </div>
                      ) : undefined}
                    />
                  </FormControl>
                  {showPurchaseHistoryOnly && (
                    <div className="text-sm text-muted-foreground">
                      Showing customer's purchase history.{" "}
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-sm"
                        onClick={() => {
                          setShowPurchaseHistoryOnly(false);
                          form.setValue('productId', '');
                          setSelectedProductInfo(null);
                          setSelectedDisplayValue('');
                        }}
                      >
                        Show all products instead
                      </Button>
                    </div>
                  )}
                  {!showPurchaseHistoryOnly && purchaseHistoryProducts.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-sm"
                        onClick={() => {
                          setShowPurchaseHistoryOnly(true);
                          form.setValue('productId', '');
                          setSelectedProductInfo(null);
                          setSelectedDisplayValue('');
                        }}
                      >
                        Show customer's purchase history instead
                      </Button>
                    </div>
                  )}
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
                      placeholder="Select"
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
                  {selectedProductInfo && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm text-blue-800">
                        <strong>Order Information:</strong>
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        Order Total: <span className="font-semibold">${selectedProductInfo.orderGrandTotal.toFixed(2)}</span>
                        {selectedProductInfo.itemsInOrder > 1 && (
                          <span className="text-blue-600 ml-1">
                            ({selectedProductInfo.itemsInOrder} items in order)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-blue-700">
                        Order: {selectedProductInfo.orderNumber} | Date: {
                          selectedProductInfo.purchaseDate 
                            ? format(new Date(selectedProductInfo.purchaseDate), 'MMM dd, yyyy')
                            : 'Unknown'
                        }
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        Item Price: ${selectedProductInfo.itemPrice.toFixed(2)}
                      </div>
                    </div>
                  )}
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