import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormDialog } from '@/components/shared/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateReturnData } from '../types';
import { createReturn } from '../api/returns';
import { useToastService } from '@/components/shared/ToastService';

interface CreateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateReturnDialog({ open, onOpenChange, onSuccess }: CreateReturnDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    customerId: '',
    reason: '',
    totalMap: '',
    refundAmount: '',
    items: [{ productId: '', quantity: '', reason: '' }]
  });
  const { showSuccess, showError } = useToastService();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const returnData: CreateReturnData = {
        orderId: formData.orderId,
        customerId: formData.customerId,
        reason: formData.reason,
        totalMap: parseFloat(formData.totalMap) || 0,
        refundAmount: parseFloat(formData.refundAmount) || 0,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: parseInt(item.quantity) || 1,
          reason: item.reason,
        }))
      };

      await createReturn(returnData);
      showSuccess(t('createReturn.messages.success'));
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setFormData({
        orderId: '',
        customerId: '',
        reason: '',
        totalMap: '',
        refundAmount: '',
        items: [{ productId: '', quantity: '', reason: '' }]
      });
    } catch (error) {
      console.error('Error creating return:', error);
      showError(t('createReturn.messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: '', reason: '' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createReturn.dialog.title')}
      description={t('createReturn.dialog.description')}
      loading={loading}
      onSubmit={handleSubmit}
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID *</Label>
            <Input
              id="orderId"
              value={formData.orderId}
              onChange={(e) => handleInputChange('orderId', e.target.value)}
              placeholder="Enter order ID"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID *</Label>
            <Input
              id="customerId"
              value={formData.customerId}
              onChange={(e) => handleInputChange('customerId', e.target.value)}
              placeholder="Enter customer ID"
              required
            />
          </div>
        </div>

        {/* Financial Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalMap">Total MAP *</Label>
            <Input
              id="totalMap"
              type="number"
              step="0.01"
              value={formData.totalMap}
              onChange={(e) => handleInputChange('totalMap', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refundAmount">Refund Amount *</Label>
            <Input
              id="refundAmount"
              type="number"
              step="0.01"
              value={formData.refundAmount}
              onChange={(e) => handleInputChange('refundAmount', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Return Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Return Reason *</Label>
          <Textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="Describe the reason for return"
            required
          />
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Return Items</Label>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-primary hover:underline"
            >
              + Add Item
            </button>
          </div>
          
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Product ID</Label>
                <Input
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  placeholder="Product ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Item Reason</Label>
                <Input
                  value={item.reason}
                  onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                  placeholder="Reason for this item"
                />
              </div>
              <div className="flex items-end">
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </FormDialog>
  );
}