import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumbs, SelectWithSearch } from '@/components';
import { useToastService } from '@/components/shared/ToastService';
import { searchAvailableProducts } from '@/modules/sales-inventory/api/products';
import { createWarrantyClaim } from '../api/warranty';
import { CreateWarrantyData, WarrantyLine } from '../types/warranty';
import { supabase } from '@/integrations/supabase/client';

const warrantyLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  serialNo: z.string().optional(),
  qty: z.number().min(1, 'Quantity must be at least 1'),
  uom: z.string().default('ea'),
  warrantyType: z.enum(['std', 'ext']),
  attachment: z.string().optional()
});

const warrantySchema = z.object({
  customerId: z.string().optional(),
  salesOrderId: z.string().optional(),
  invoiceDate: z.date().optional(),
  faultDesc: z.string().min(10, 'Fault description must be at least 10 characters'),
  lines: z.array(warrantyLineSchema).min(1, 'At least one product line is required')
});

type WarrantyFormData = z.infer<typeof warrantySchema>;

export function NewWarrantyClaim() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastService();
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<Omit<WarrantyLine, 'id' | 'headerId' | 'createdAt' | 'updatedAt'>[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const breadcrumbs = [
    { title: 'After-Sales', href: '/store/after-sales/returns' },
    { title: 'Warranty Claims', href: '/store/after-sales/returns?tab=warranty' },
    { title: 'New Claim' }
  ];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await searchAvailableProducts('');
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  const form = useForm<WarrantyFormData>({
    resolver: zodResolver(warrantySchema),
    defaultValues: {
      faultDesc: '',
      lines: []
    }
  });

  const addLine = () => {
    const newLine = {
      productId: '',
      serialNo: '',
      qty: 1,
      uom: 'ea',
      warrantyType: 'std' as const
    };
    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
    form.setValue('lines', updatedLines);
  };

  const removeLine = (index: number) => {
    const updatedLines = lines.filter((_, i) => i !== index);
    setLines(updatedLines);
    form.setValue('lines', updatedLines);
  };

  const updateLine = (index: number, field: keyof typeof lines[0], value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setLines(updatedLines);
    form.setValue('lines', updatedLines);
  };

  const onSubmit = async (data: WarrantyFormData) => {
    // Validate that we have product lines
    if (lines.length === 0) {
      showError('Error', 'Please add at least one product line');
      return;
    }

    // Validate that all lines have required data
    const invalidLines = lines.some(line => !line.productId || line.qty < 1);
    if (invalidLines) {
      showError('Error', 'Please ensure all product lines have valid product and quantity');
      return;
    }

    // Set lines in form data for validation
    form.setValue('lines', lines);

    try {
      setSaving(true);
      
      // Get current user and their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated. Please log in.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.store_id) {
        throw new Error('Store ID not found. Please ensure your profile is set up properly.');
      }

      const createData: CreateWarrantyData = {
        customerId: data.customerId || undefined,
        salesOrderId: data.salesOrderId || undefined,
        invoiceDate: data.invoiceDate,
        faultDesc: data.faultDesc,
        storeId: profile.store_id,
        lines
      };

      await createWarrantyClaim(createData);
      
      showSuccess('Success', 'Warranty claim created successfully');
      navigate('/store/after-sales/returns?tab=warranty');
    } catch (error) {
      console.error('Failed to create warranty claim:', error);
      showError('Error', error instanceof Error ? error.message : 'Failed to create warranty claim');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      
      <div>
        <h1 className="text-3xl font-bold">New Warranty Claim</h1>
        <p className="text-muted-foreground">
          Create a new warranty claim for defective products
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claim Information</CardTitle>
              <CardDescription>
                Basic information about the warranty claim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter customer ID..." 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="salesOrderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Order (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter sales order ID..." 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field} 
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="faultDesc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fault Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the product defect or issue in detail..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Lines</CardTitle>
                  <CardDescription>
                    Add products covered by this warranty claim
                  </CardDescription>
                </div>
                <Button type="button" onClick={addLine} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products added yet. Click "Add Product" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Serial No.</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Warranty Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <SelectWithSearch
                            placeholder="Select product..."
                            options={products.map(p => ({
                              value: p.id,
                              label: `${p.sku} - ${p.productName}`
                            }))}
                            value={line.productId}
                            onValueChange={(value) => updateLine(index, 'productId', value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Serial number"
                            value={line.serialNo || ''}
                            onChange={(e) => updateLine(index, 'serialNo', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={line.qty}
                            onChange={(e) => updateLine(index, 'qty', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={line.warrantyType}
                            onValueChange={(value) => updateLine(index, 'warrantyType', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="std">Standard</SelectItem>
                              <SelectItem value="ext">Extended</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || lines.length === 0}>
              {saving ? 'Creating...' : 'Create Warranty Claim'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/store/after-sales/returns?tab=warranty')}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}