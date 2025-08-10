import { z } from 'zod';

export const salesOrderLineSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  productName: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  subTotal: z.number().nonnegative(),
  // Extended warranty fields
  warrantyYears: z.number().int().optional(),
  warrantyAmount: z.number().optional(),
  // MAP and profit tracking
  mapPrice: z.number().optional(),
  priceMapRate: z.number().optional(),
  unitCostAtSale: z.number().optional(),
  grossProfit: z.number().optional(),
});

export const salesOrderCreateSchema = z.object({
  orderDate: z.string(),
  orderType: z.enum(["retail", "wholesale"]).optional().default("retail"),
  status: z.enum(["draft", "submitted", "pending", "confirmed", "shipped", "completed", "cancelled"]),
  subTotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  lines: z.array(salesOrderLineSchema).min(1),
  
  // Customer information (enhanced with first/last names)
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerFirst: z.string().optional(),
  customerLast: z.string().optional(),
  
  // Address fields
  addrCountry: z.string().optional(),
  addrState: z.string().optional(),
  addrCity: z.string().optional(),
  addrStreet: z.string().optional(),
  addrZipcode: z.string().optional(),
  
  // Extended warranty
  warrantyYears: z.number().int().optional(),
  warrantyAmount: z.number().optional(),
  
  // Service and delivery options
  walkInDelivery: z.string().optional(),
  accessory: z.string().optional(),
  otherServices: z.string().optional(),
  otherFee: z.number().optional(),
  deliveryFee: z.number().optional().default(0),
  accessoryFee: z.number().optional().default(0),
  
  // Payment methods (up to 3 payment methods)
  paymentMethod1: z.string().optional(),
  paymentAmount1: z.number().optional(),
  paymentMethod2: z.string().optional(),
  paymentAmount2: z.number().optional(),
  paymentMethod3: z.string().optional(),
  paymentAmount3: z.number().optional(),
  paymentNote: z.string().optional(),
  
  // Customer source and cashier
  customerSource: z.string().optional(),
  cashierId: z.string().uuid().optional(),
  cashierFirst: z.string().optional(),
  cashierLast: z.string().optional(),
});

export const salesOrderResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  orderDate: z.string(),
  status: z.string(),
  totalAmount: z.number(),
  customerName: z.string().optional(),
  customerFirst: z.string().optional(),
  customerLast: z.string().optional(),
  // Cost data (filtered based on role)
  totalGrossProfit: z.number().optional(),
  avgPriceMapRate: z.number().optional(),
  lines: z.array(salesOrderLineSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const salesOrderListSchema = z.object({
  orders: z.array(salesOrderResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

export type SalesOrderCreate = z.infer<typeof salesOrderCreateSchema>;
export type SalesOrderResponse = z.infer<typeof salesOrderResponseSchema>;
export type SalesOrderLine = z.infer<typeof salesOrderLineSchema>;
export type SalesOrderList = z.infer<typeof salesOrderListSchema>;