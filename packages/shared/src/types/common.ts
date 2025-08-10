// Common types and interfaces used across the application
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface UserContext {
  userId: string;
  role: string;
  storeId?: string;
  firstName?: string;
  lastName?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
}

export type UserRole = 'store_employee' | 'store_manager' | 'hq_admin';

export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  services: {
    database: string;
    auth: string;
  };
}