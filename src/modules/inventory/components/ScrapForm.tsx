import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SelectWithSearch } from '@/components/shared/SelectWithSearch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { scrapHeaderSchema, SCRAP_REASONS } from '../../scrap/types/scrap';
import type { ScrapHeaderData, ScrapLineData } from '../../scrap/types/scrap';
import { createScrapHeader, submitScrap, checkInventoryAvailability } from '../../scrap/api/scrap';
import { getWarehouses } from '../../after-sales/api/newReturns';
import { supabase } from '@/integrations/supabase/client';

interface ScrapFormProps {
  initialData?: Partial<ScrapHeaderData>;
  mode?: 'create' | 'edit';
  onSave?: (data: ScrapHeaderData) => void;
}

export function ScrapForm({ initialData, mode = 'create', onSave }: ScrapFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouseOptions, setWarehouseOptions] = useState<{ value: string; label: string }[]>([]);
  const [productOptions, setProductOptions] = useState<{ value: string; label: string; cost?: number }[]>([]);

  const form = useForm<ScrapHeaderData>({
    resolver: zodResolver(scrapHeaderSchema),
    defaultValues: {
      status: 'draft',
      storeId: '',
      warehouseId: '',
      lines: [{
        productId: '',
        qty: 1,
        uom: 'ea',
        unitCost: 0,
        reason: '',
        batchNo: '',
      }],
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  // Load warehouses
  useEffect(() => {
    getWarehouses().then(setWarehouseOptions).catch(console.error);
  }, []);

  // Load products - simplified search function
  const handleProductSearch = async (search: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku, product_name, price')
        .or(`sku.ilike.%${search}%,product_name.ilike.%${search}%`)
        .eq('is_active', true)
        .limit(20);

      if (error) {
        console.error('Error searching products:', error);
        return;
      }

      const options = (data || []).map(product => ({
        value: product.id,
        label: `${product.sku} - ${product.product_name}`,
        cost: product.price || 0,
      }));
      setProductOptions(options);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  // Handle product selection
  const handleProductSelect = async (index: number, productId: string) => {
    const product = productOptions.find(p => p.value === productId);
    if (product) {
      form.setValue(`lines.${index}.productId`, productId);
      form.setValue(`lines.${index}.unitCost`, product.cost || 0);
      
      // Check inventory availability
      try {
        const storeId = form.getValues('storeId');
        if (storeId) {
          const available = await checkInventoryAvailability(productId, storeId);
          if (available <= 0) {
            toast.warning(t('scrapManagement.messages.inventoryWarning', { product: product.label }));
          }
        }
      } catch (error) {
        console.error('Error checking inventory:', error);
      }
    }
  };

  // Calculate totals
  const watchedLines = form.watch('lines');
  const totalQty = watchedLines.reduce((sum, line) => sum + (line.qty || 0), 0);
  const totalValue = watchedLines.reduce((sum, line) => sum + ((line.qty || 0) * (line.unitCost || 0)), 0);

  // Add new line
  const addLine = () => {
    append({
      productId: '',
      qty: 1,
      uom: 'ea',
      unitCost: 0,
      reason: '',
      batchNo: '',
    });
  };

  // Remove line
  const removeLine = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Save as draft
  const handleSave = async (data: ScrapHeaderData) => {
    try {
      setIsSubmitting(true);
      
      const result = await createScrapHeader({
        ...data,
        status: 'draft',
      });

      toast.success(t('scrapManagement.messages.saveSuccess'));
      
      if (onSave) {
        onSave(data);
      } else {
        navigate(`/store/scrap/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving scrap:', error);
      toast.error(t('scrapManagement.messages.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit for approval
  const handleSubmit = async (data: ScrapHeaderData) => {
    try {
      setIsSubmitting(true);
      
      const result = await createScrapHeader({
        ...data,
        status: 'draft',
      });

      await submitScrap(result.id);

      toast.success(t('scrapManagement.messages.submitSuccess'));
      navigate(`/store/scrap/${result.id}`);
    } catch (error) {
      console.error('Error submitting scrap:', error);
      toast.error(t('scrapManagement.messages.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? t('scrapManagement.form.newTitle') : t('scrapManagement.form.editTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              {/* Warehouse Selection */}
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('scrapManagement.form.warehouse')} *</FormLabel>
                    <FormControl>
                      <SelectWithSearch
                        options={warehouseOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t('scrapManagement.form.warehousePlaceholder')}
                        searchPlaceholder={t('scrapManagement.form.searchWarehouse')}
                        emptyText={t('scrapManagement.form.noWarehouses')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t('scrapManagement.form.lineItems')}</h3>
                  <Button type="button" onClick={addLine} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('scrapManagement.form.addItem')}
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('scrapManagement.form.product')} *</TableHead>
                          <TableHead>{t('scrapManagement.form.batchSerial')}</TableHead>
                          <TableHead>{t('scrapManagement.form.quantity')} *</TableHead>
                          <TableHead>{t('scrapManagement.form.uom')}</TableHead>
                          <TableHead>{t('scrapManagement.form.unitCost')} *</TableHead>
                          <TableHead>{t('scrapManagement.form.reason')} *</TableHead>
                          <TableHead>{t('scrapManagement.form.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell className="w-64">
                              <FormField
                                control={form.control}
                                name={`lines.${index}.productId`}
                                render={({ field }) => (
                                  <SelectWithSearch
                                    options={productOptions}
                                    value={field.value}
                                    onValueChange={(value) => handleProductSelect(index, value)}
                                    onSearchChange={handleProductSearch}
                                    placeholder={t('scrapManagement.form.searchProducts')}
                                    searchPlaceholder={t('scrapManagement.form.searchProductsPlaceholder')}
                                    emptyText={t('scrapManagement.form.noProducts')}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`lines.${index}.batchNo`}
                                render={({ field }) => (
                                  <Input {...field} placeholder={t('scrapManagement.form.optional')} />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`lines.${index}.qty`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`lines.${index}.uom`}
                                render={({ field }) => (
                                  <Input {...field} placeholder="ea" />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`lines.${index}.unitCost`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`lines.${index}.reason`}
                                render={({ field }) => (
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('scrapManagement.form.selectReason')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SCRAP_REASONS.map((reason) => (
                                        <SelectItem key={reason.value} value={reason.value}>
                                          {reason.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLine(index)}
                                disabled={fields.length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="space-y-2 text-right">
                    <div className="text-sm">
                      <span className="font-medium">{t('scrapManagement.form.totalQuantity')} </span>
                      <span className="font-mono">{totalQty}</span>
                    </div>
                    <div className="text-lg font-medium">
                      <span>{t('scrapManagement.form.totalValue')} </span>
                      <span className="font-mono">${totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/store/scrap')}
                >
                  {t('common.cancel')}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(handleSave)}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('scrapManagement.form.saveDraft')}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isSubmitting}>
                      <Send className="h-4 w-4 mr-2" />
                      {t('scrapManagement.form.submitApproval')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('scrapManagement.form.submitTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('scrapManagement.form.submitDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={form.handleSubmit(handleSubmit)}>
                        {t('scrapManagement.form.submit')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}