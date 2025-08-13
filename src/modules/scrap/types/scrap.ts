import { z } from 'zod';

// Scrap status enum
export type ScrapStatus = 'draft' | 'submitted' | 'l1_approved' | 'final_approved' | 'posted' | 'rejected' | 'cancelled';

// Scrap audit action enum
export type ScrapAuditAction = 'submit' | 'approve_l1' | 'approve_final' | 'reject' | 'cancel' | 'post' | 'reverse';

// Scrap reasons
export const SCRAP_REASONS = [
  { value: 'damage', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'obsolete', label: 'Obsolete' },
  { value: 'defective', label: 'Manufacturing Defect' },
  { value: 'contaminated', label: 'Contaminated' },
  { value: 'other', label: 'Other' },
] as const;

// Zod Schemas
export const scrapLineSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  batchNo: z.string().optional(),
  qty: z.number().int().positive({
    message: 'Quantity must be a positive integer',
  }),
  uom: z.string().optional().default('ea'),
  unitCost: z.number().optional(),
  reason: z.string().min(1, {
    message: 'Reason is required',
  }),
  attachmentId: z.string().uuid().optional(),
});

export const scrapHeaderSchema = z.object({
  id: z.string().uuid().optional(),
  scrapNo: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'l1_approved', 'final_approved', 'posted', 'rejected', 'cancelled'] as const).default('draft'),
  storeId: z.string().uuid().optional(),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  lines: z.array(scrapLineSchema).min(1, {
    message: 'At least one line item is required',
  }),
  totalQty: z.number().optional(),
  totalValue: z.number().optional(),
}).refine((data) => {
  // Validate total quantity > 0
  const totalQty = data.lines.reduce((sum, line) => sum + line.qty, 0);
  return totalQty > 0;
}, {
  message: 'Total quantity must be greater than 0',
  path: ['lines'],
});

export const scrapAuditSchema = z.object({
  action: z.enum(['submit', 'approve_l1', 'approve_final', 'reject', 'cancel', 'post', 'reverse'] as const),
  comment: z.string().optional(),
});

// TypeScript Types
export type ScrapLineData = z.infer<typeof scrapLineSchema>;
export type ScrapHeaderData = z.infer<typeof scrapHeaderSchema>;
export type ScrapAuditData = z.infer<typeof scrapAuditSchema>;

// Extended types for display
export interface ScrapLine extends ScrapLineData {
  id: string;
  headerId: string;
  product?: {
    sku: string;
    productName: string;
    price: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScrapHeader {
  id: string;
  scrapNo: string;
  status: ScrapStatus;
  storeId: string;
  warehouseId: string;
  totalQty: number;
  totalValue: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lines?: ScrapLine[];
  audit?: ScrapAudit[];
}

export interface ScrapAudit {
  id: string;
  headerId: string;
  action: ScrapAuditAction;
  actorId: string;
  comment?: string;
  createdAt: string;
  actor?: {
    fullName: string;
    role: string;
  };
}

// Filters for scrap list
export interface ScrapFilters {
  status?: ScrapStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Role permissions matrix
export const ROLE_PERMISSIONS = {
  store_employee: ['create', 'view'],
  store_manager: ['create', 'view', 'submit', 'cancel'],
  warehouse_supervisor: ['view', 'approve_l1', 'reject'],
  hq_controller: ['view', 'approve_final', 'reverse'],
  finance_audit: ['view'],
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;
export type Permission = typeof ROLE_PERMISSIONS[UserRole][number];