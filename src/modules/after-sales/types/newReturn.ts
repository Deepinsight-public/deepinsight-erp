import { z } from 'zod';

export const returnFormSchema = z.object({
  returnDate: z.date({
    message: 'Return date is required',
  }),
  returnType: z.enum(['store', 'warehouse'], {
    message: 'Return type is required',
  }),
  customerEmail: z.string().email().optional(),
  customerFirst: z.string().optional(),
  customerLast: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  productId: z.string({
    message: 'Product selection is required',
  }),
  reason: z.string().min(1, 'Return reason is required'),
  refundAmount: z.number().positive('Refund amount must be greater than 0'),
}).refine((data) => {
  if (data.returnType === 'store') {
    return data.customerEmail && data.customerFirst && data.customerLast;
  }
  if (data.returnType === 'warehouse') {
    return data.warehouseId;
  }
  return true;
}, {
  message: 'Required fields based on return type are missing',
  path: ['returnType'],
}).transform((data) => {
  // Clear warehouseId when return type is store to avoid validation errors
  if (data.returnType === 'store') {
    return { ...data, warehouseId: undefined };
  }
  return data;
});

export type ReturnFormData = z.infer<typeof returnFormSchema>;

export interface CustomerLookupResult {
  id: string;
  name: string;
  email: string;
  customerFirst?: string;
  customerLast?: string;
}

export interface WarehouseOption {
  value: string;
  label: string;
}

export interface ProductMapData {
  mapPrice: number;
}

export interface AfterSalesReturn {
  id: string;
  storeId: string;
  returnDate: string;
  returnType: 'store' | 'warehouse';
  warehouseId?: string;
  customerEmail?: string;
  customerFirst?: string;
  customerLast?: string;
  productId: string;
  reason: string;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
}