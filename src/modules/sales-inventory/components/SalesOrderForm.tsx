import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, FormDialog, SelectWithSearch, ConfirmDialog, LoadingOverlay } from '@/components';
import { useToast } from '@/hooks/use-toast';
import { SalesOrderDTO, SalesOrderLineDTO, ProductLookupItem } from '../types';
import { fetchProductLookup, fetchStockLevel, createSalesOrder, updateSalesOrder } from '../api/sales-orders';

interface SalesOrderFormProps {
  initialData?: SalesOrderDTO;
  onSave?: (order: SalesOrderDTO) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export function SalesOrderForm({ initialData, onSave, onCancel, readOnly = false }: SalesOrderFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<ProductLookupItem[]>([]);
  const [lines, setLines] = useState<SalesOrderLineDTO[]>(initialData?.lines || []);

  const { register, handleSubmit, watch, setValue, getValues } = useForm<SalesOrderDTO>({
    defaultValues: {
      orderDate: initialData?.orderDate || new Date().toISOString().split('T')[0],
      orderType: initialData?.orderType || 'retail',
      customerName: initialData?.customerName || '',
      customerEmail: initialData?.customerEmail || '',
      customerPhone: initialData?.customerPhone || '',
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
      const orderData: SalesOrderDTO = {
        ...formData,
        status,
        lines,
        ...totals
      };

      const savedOrder = initialData?.id 
        ? await updateSalesOrder(initialData.id, orderData)
        : await createSalesOrder(orderData);

      toast({
        title: 'Success',
        description: `Order ${status === 'draft' ? 'saved as draft' : 'submitted'} successfully`
      });
      
      onSave?.(savedOrder);
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
      
      {/* Order Header */}
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                {...register('customerName')}
                disabled={readOnly}
              />
            </div>
            <div>
              <Label htmlFor="orderDate">Order Date</Label>
              <Input
                id="orderDate"
                type="date"
                {...register('orderDate')}
                disabled={readOnly}
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                disabled={readOnly}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                {...register('customerPhone')}
                disabled={readOnly}
              />
            </div>
          </div>
          
          {!readOnly && (
            <div>
              <Label>Order Type</Label>
              <RadioGroup
                value={watch('orderType')}
                onValueChange={(value) => setValue('orderType', value as 'retail' | 'wholesale')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="retail" id="retail" />
                  <Label htmlFor="retail">Retail</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wholesale" id="wholesale" />
                  <Label htmlFor="wholesale">Wholesale</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </CardContent>
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