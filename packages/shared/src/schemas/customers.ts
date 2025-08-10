import { z } from 'zod';

export const customerSchema = z.object({
  id: z.string().uuid(),
  customerCode: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  totalOrders: z.number().default(0),
  totalSpent: z.number().default(0),
  storeId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const customerCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
  country: z.string().optional(),
});

export const customerListSchema = z.object({
  customers: z.array(customerSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

export const customerInteractionsSchema = z.object({
  orders: z.array(z.object({
    id: z.string(),
    orderNumber: z.string(),
    orderDate: z.string(),
    totalAmount: z.number(),
    status: z.string(),
  })),
  returns: z.array(z.object({
    id: z.string(),
    returnNumber: z.string(),
    returnDate: z.string(),
    totalAmount: z.number(),
    status: z.string(),
  })),
  repairs: z.array(z.object({
    id: z.string(),
    repairNumber: z.string(),
    createdAt: z.string(),
    status: z.string(),
    estimatedCost: z.number().optional(),
  })),
});

export type Customer = z.infer<typeof customerSchema>;
export type CustomerCreate = z.infer<typeof customerCreateSchema>;
export type CustomerList = z.infer<typeof customerListSchema>;
export type CustomerInteractions = z.infer<typeof customerInteractionsSchema>;