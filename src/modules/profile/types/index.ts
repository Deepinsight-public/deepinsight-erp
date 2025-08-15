export interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  store_id?: string;
}

export interface ProfileFormData {
  full_name: string;
  email: string;
  phone: string;
  role?: string;
  store_id?: string;
}

export interface Store {
  id: string;
  store_name: string;
  store_code: string;
  region?: string;
  status?: string;
}

export const USER_ROLES = [
  'store_manager',
  'store_employee', 
  'warehouse_manager',
  'warehouse_employee',
  'hq_admin',
  'hq_manager',
  'warehouse_admin',
  'store_staff',
] as const;

export type UserRole = typeof USER_ROLES[number];