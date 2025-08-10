// RBAC system for ERP domain services
import { UserContext } from '/packages/shared/src/index.ts';

export enum Role {
  HQ_ADMIN = 'hq_admin',
  STORE_MANAGER = 'store_manager', 
  STORE_EMPLOYEE = 'store_employee'
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  scope?: 'own' | 'store' | 'all';
}

export class RBACService {
  private static permissions: Record<Role, Permission[]> = {
    [Role.HQ_ADMIN]: [
      { resource: '*', action: 'create', scope: 'all' },
      { resource: '*', action: 'read', scope: 'all' },
      { resource: '*', action: 'update', scope: 'all' },
      { resource: '*', action: 'delete', scope: 'all' }
    ],
    [Role.STORE_MANAGER]: [
      { resource: 'sales_orders', action: 'create', scope: 'store' },
      { resource: 'sales_orders', action: 'read', scope: 'store' },
      { resource: 'sales_orders', action: 'update', scope: 'store' },
      { resource: 'customers', action: 'create', scope: 'store' },
      { resource: 'customers', action: 'read', scope: 'store' },
      { resource: 'customers', action: 'update', scope: 'store' },
      { resource: 'inventory', action: 'read', scope: 'store' },
      { resource: 'inventory', action: 'update', scope: 'store' },
      { resource: 'returns', action: 'create', scope: 'store' },
      { resource: 'returns', action: 'read', scope: 'store' },
      { resource: 'returns', action: 'update', scope: 'store' },
      { resource: 'repairs', action: 'create', scope: 'store' },
      { resource: 'repairs', action: 'read', scope: 'store' },
      { resource: 'repairs', action: 'update', scope: 'store' },
      { resource: 'scrap', action: 'create', scope: 'store' },
      { resource: 'scrap', action: 'read', scope: 'store' },
      { resource: 'scrap', action: 'update', scope: 'store' },
      { resource: 'transfers', action: 'create', scope: 'store' },
      { resource: 'transfers', action: 'read', scope: 'store' },
      { resource: 'transfers', action: 'update', scope: 'store' },
      { resource: 'purchase_requests', action: 'create', scope: 'store' },
      { resource: 'purchase_requests', action: 'read', scope: 'store' },
    ],
    [Role.STORE_EMPLOYEE]: [
      { resource: 'sales_orders', action: 'create', scope: 'store' },
      { resource: 'sales_orders', action: 'read', scope: 'store' },
      { resource: 'customers', action: 'create', scope: 'store' },
      { resource: 'customers', action: 'read', scope: 'store' },
      { resource: 'inventory', action: 'read', scope: 'store' },
      { resource: 'returns', action: 'create', scope: 'store' },
      { resource: 'returns', action: 'read', scope: 'store' },
      { resource: 'repairs', action: 'create', scope: 'store' },
      { resource: 'repairs', action: 'read', scope: 'store' },
      { resource: 'scrap', action: 'create', scope: 'store' },
      { resource: 'scrap', action: 'read', scope: 'store' },
      { resource: 'purchase_requests', action: 'create', scope: 'store' },
      { resource: 'purchase_requests', action: 'read', scope: 'store' },
    ]
  };

  static hasPermission(
    userContext: UserContext,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete',
    targetStoreId?: string
  ): boolean {
    const userRole = userContext.role as Role;
    const permissions = this.permissions[userRole] || [];

    // Check for wildcard permission (HQ_ADMIN)
    const wildcardPermission = permissions.find(p => 
      p.resource === '*' && p.action === action
    );
    if (wildcardPermission) return true;

    // Check for specific resource permission
    const resourcePermission = permissions.find(p =>
      p.resource === resource && p.action === action
    );
    
    if (!resourcePermission) return false;

    // Check scope restrictions
    if (resourcePermission.scope === 'all') return true;
    if (resourcePermission.scope === 'store') {
      // Must be same store or no target store specified
      return !targetStoreId || targetStoreId === userContext.storeId;
    }
    if (resourcePermission.scope === 'own') {
      // Additional logic for own resources would go here
      return true;
    }

    return false;
  }

  static canSeeCostData(userContext: UserContext): boolean {
    const role = userContext.role as Role;
    return role === Role.HQ_ADMIN || role === Role.STORE_MANAGER;
  }

  static filterCostData<T extends Record<string, any>>(
    userContext: UserContext,
    data: T
  ): T {
    if (this.canSeeCostData(userContext)) {
      return data;
    }

    // Remove cost-sensitive fields for store employees
    const costFields = [
      'cost', 'unitCost', 'unit_cost', 'unit_cost_at_sale',
      'grossProfit', 'gross_profit', 'total_gross_profit',
      'priceMapRate', 'price_map_rate', 'avgPriceMapRate', 'avg_price_map_rate'
    ];

    const filtered = { ...data };
    costFields.forEach(field => {
      if (field in filtered) {
        delete filtered[field];
      }
    });

    return filtered;
  }

  static requirePermission(
    userContext: UserContext,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete',
    targetStoreId?: string
  ): void {
    if (!this.hasPermission(userContext, resource, action, targetStoreId)) {
      throw new Error(`Access denied: insufficient permissions for ${action} on ${resource}`);
    }
  }

  static requireStoreAccess(userContext: UserContext, targetStoreId: string): void {
    if (userContext.role !== Role.HQ_ADMIN && userContext.storeId !== targetStoreId) {
      throw new Error(`Access denied: cannot access store ${targetStoreId}`);
    }
  }
}