import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
  }),
  session: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_at: z.number(),
  }),
  profile: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.string(),
    storeId: z.string().uuid().optional(),
  }),
});

export const healthCheckSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  version: z.string(),
  services: z.object({
    database: z.enum(['up', 'down']),
    auth: z.enum(['up', 'down']),
  }),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type HealthCheck = z.infer<typeof healthCheckSchema>;