import { z } from 'zod';

export const returnFormSchema = z.object({
  returnDate: z.date({
    message: 'Return date is required',
  }),
  returnType: z.enum(['store', 'warehouse'], {
    message: 'Return type is required',
  }),
  customerEmail: z.string().optional(),
  customerFirst: z.string().optional(),
  customerLast: z.string().optional(),
  warehouseId: z.string().optional(),
  productId: z.string({
    message: 'Product selection is required',
  }),
  reason: z.string().min(1, 'Return reason is required'),
  refundAmount: z.number().positive('Refund amount must be greater than 0'),
  // New optional fields
  status: z.enum(['processing', 'failed', 'approved']).default('processing'),
  selfScraped: z.boolean().default(false),
  mapPrice: z.number().optional(),
  totalAmountPaid: z.number().optional(),
}).refine((data) => {
  if (data.returnType === 'store') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = data.customerEmail && emailRegex.test(data.customerEmail) && data.customerFirst && data.customerLast;
    return isValid;
  }
  if (data.returnType === 'warehouse') {
    // Simple UUID format check (8-4-4-4-12 pattern)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const isValid = data.warehouseId && uuidRegex.test(data.warehouseId);
    return isValid;
  }
  return true;
}, {
  message: 'Required fields based on return type are missing',
  path: ['returnType'],
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
  // New columns
  approvalMonth?: string;
  status: 'processing' | 'failed' | 'approved';
  selfScraped: boolean;
  mapPrice?: number;
  totalAmountPaid?: number;
  product?: {
    sku: string;
    productName: string;
    price: number;
  };
}