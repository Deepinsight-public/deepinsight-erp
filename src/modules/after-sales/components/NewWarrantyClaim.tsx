import React, { useState } from 'react';
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
import { Breadcrumbs, useToastService } from '@/components';
import { createWarrantyClaim } from '../api/warranty';
import { CreateWarrantyData, WarrantyLine } from '../types/warranty';

const warrantyLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  serialNo: z.string().optional(),
  qty: z.number().min(1, 'Quantity must be at least 1'),
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
  const { toast } = useToastService();
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<Omit<WarrantyLine, 'id' | 'headerId' | 'createdAt' | 'updatedAt'>[]>([]);

  const breadcrumbs = [
    { title: 'After-Sales', href: '/store/after-sales/returns' },
    { title: 'Warranty Claims', href: '/store/after-sales/warranty' },
    { title: 'New Claim' }
  ];

  const form = useForm<WarrantyFormData>({
    resolver: zodResolver(warrantySchema),
    defaultValues: {
      faultDesc: '',
      lines: []
    }
  });

  const addLine = () => {
    setLines([...lines, {
      productId: '',
      serialNo: '',
      qty: 1,
      uom: 'ea',
      warrantyType: 'std'
    }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof typeof lines[0], value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setLines(updatedLines);
  };

  const onSubmit = async (data: WarrantyFormData) => {
    if (lines.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one product line',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Get user's store ID from profile
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const storeId = user.store_id || '550e8400-e29b-41d4-a716-446655440000';

      const createData: CreateWarrantyData = {
        ...data,
        storeId,
        lines
      };

      const newClaim = await createWarrantyClaim(createData);
      
      toast({
        title: 'Success',
        description: 'Warranty claim created successfully'
      });
      
      navigate(`/store/after-sales/warranty/${newClaim.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create warranty claim',
        variant: 'destructive'
      });
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
                        <Input placeholder="Select customer..." {...field} />
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
                        <Input placeholder="Select sales order..." {...field} />
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
                    <FormLabel>Fault Description</FormLabel>
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
                          <Input
                            placeholder="Select product..."
                            value={line.productId}
                            onChange={(e) => updateLine(index, 'productId', e.target.value)}
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
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Warranty Claim'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/store/after-sales/warranty')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}