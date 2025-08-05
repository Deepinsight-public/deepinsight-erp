export type UserRole = "hq_admin" | "warehouse_admin" | "store_manager" | "store_staff";

export interface UserProfile {
  id: string;
  user_id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  store_id?: string;
  role: UserRole;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  store_id?: string;
  warehouse_id?: string;
  created_at: string;
  updated_at: string;
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, { en: string; zh: string }> = {
  hq_admin: { en: "HQ Admin", zh: "HQ 管理员" },
  warehouse_admin: { en: "Warehouse Admin", zh: "总库管理员" },
  store_manager: { en: "Store Manager", zh: "门店经理" },
  store_staff: { en: "Store Staff", zh: "门店员工" }
};

export const ROLE_PERMISSIONS = {
  hq_admin: ["view_all", "manage_all", "create_stores", "manage_users"],
  warehouse_admin: ["view_warehouse", "manage_inventory", "create_transfers"],
  store_manager: ["view_store", "manage_store", "create_orders", "manage_staff"],
  store_staff: ["view_store", "create_orders", "view_inventory"]
} as const;