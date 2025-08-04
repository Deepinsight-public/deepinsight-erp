import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  page: z.number().min(1),
  pageSize: z.number().min(1).max(100),
  total: z.number().min(0),
});

export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string(),
});

// Auth schemas
export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  storeId: z.string().optional(),
});

export const LoginResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      username: z.string(),
      name: z.string(),
      role: z.string(),
      storeId: z.string(),
      storeName: z.string(),
    }),
  }).optional(),
});

// Sales Order schemas
export const SalesOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  totalAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SalesOrderListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    orders: z.array(SalesOrderSchema),
    pagination: PaginationSchema,
  }).optional(),
});

// Purchase Request schemas
export const PurchaseRequestSchema = z.object({
  id: z.string(),
  requestNumber: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'ordered']),
  totalAmount: z.number(),
  requestedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PurchaseRequestListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    requests: z.array(PurchaseRequestSchema),
    pagination: PaginationSchema,
  }).optional(),
});

// Inventory schemas
export const InventoryItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  sku: z.string(),
  currentStock: z.number(),
  reservedStock: z.number(),
  availableStock: z.number(),
  minStockLevel: z.number(),
  maxStockLevel: z.number(),
  lastUpdated: z.string(),
});

export const InventoryListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    items: z.array(InventoryItemSchema),
    pagination: PaginationSchema,
  }).optional(),
});

// Customer schemas
export const CustomerSchema = z.object({
  id: z.string(),
  customerNumber: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  totalOrders: z.number(),
  totalSpent: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CustomerListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    customers: z.array(CustomerSchema),
    pagination: PaginationSchema,
  }).optional(),
});

// Product schemas
export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  price: z.number(),
  cost: z.number(),
  status: z.enum(['active', 'inactive', 'discontinued']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProductListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    products: z.array(ProductSchema),
    pagination: PaginationSchema,
  }).optional(),
});

// Return schemas
export const ReturnSchema = z.object({
  id: z.string(),
  returnNumber: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  reason: z.string(),
  status: z.enum(['requested', 'approved', 'rejected', 'completed']),
  totalAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReturnListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    returns: z.array(ReturnSchema),
    pagination: PaginationSchema,
  }).optional(),
});

// Repair schemas
export const RepairSchema = z.object({
  id: z.string(),
  repairNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  productId: z.string(),
  productName: z.string(),
  description: z.string(),
  status: z.enum(['received', 'diagnosing', 'repairing', 'completed', 'cancelled']),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RepairListResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    repairs: z.array(RepairSchema),
    pagination: PaginationSchema,
  }).optional(),
});

// Export all types
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type SalesOrder = z.infer<typeof SalesOrderSchema>;
export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Return = z.infer<typeof ReturnSchema>;
export type Repair = z.infer<typeof RepairSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;