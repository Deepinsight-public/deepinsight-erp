// Return management service
import { UserContext, PaginationOptions, ApiError, ErrorCodes } from '/packages/shared/src/index.ts';
import { RBACService } from '../rbac.ts';
import { AuditLogger, withAudit } from '../audit.ts';

export interface Return {
  id: string;
  returnNumber?: string;
  reason: string;
  status: string;
  refundAmount: number;
  storeId: string;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  items?: any;
  numberOfItems: number;
  totalMap: number;
  isCustomerReturn: boolean;
  returnType: string;
  warehouseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnCreate {
  reason: string;
  refundAmount: number;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  items?: any;
  numberOfItems: number;
  totalMap?: number;
  isCustomerReturn?: boolean;
  returnType?: string;
  warehouseId?: string;
}

export interface ReturnUpdate {
  status?: string;
  refundAmount?: number;
  reason?: string;
}

export interface ReturnList {
  returns: Return[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export class ReturnService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private authToken?: string;
  private auditLogger: AuditLogger;

  constructor(supabaseUrl: string, supabaseKey: string, auditLogger: AuditLogger, authToken?: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.authToken = authToken;
    this.auditLogger = auditLogger;
  }

  private getClient() {
    const createClient = (globalThis as any).createClient;
    return createClient(this.supabaseUrl, this.supabaseKey, {
      global: {
        headers: this.authToken ? { Authorization: this.authToken } : {}
      }
    });
  }

  async getReturns(
    userContext: UserContext,
    options: PaginationOptions & { status?: string; isCustomerReturn?: boolean }
  ): Promise<ReturnList> {
    RBACService.requirePermission(userContext, 'returns', 'read');

    const { page, limit, status, isCustomerReturn } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = this.getClient();
    
    let query = supabase
      .from('vw_returns_unified')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userContext.storeId) {
      RBACService.requireStoreAccess(userContext, userContext.storeId);
      query = query.eq('store_id', userContext.storeId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (isCustomerReturn !== undefined) {
      query = query.eq('is_customer_return', isCustomerReturn);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 500, error.message);
    }

    const returns = data?.map(this.mapDatabaseToResponse) || [];

    return {
      returns,
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  async getReturn(returnId: string, userContext: UserContext): Promise<Return> {
    RBACService.requirePermission(userContext, 'returns', 'read');

    const supabase = this.getClient();
    
    const { data, error } = await supabase
      .from('vw_returns_unified')
      .select('*')
      .eq('id', returnId)
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.RETURN_NOT_FOUND, 404, 'Return not found');
    }

    // Verify store access
    if (data.store_id) {
      RBACService.requireStoreAccess(userContext, data.store_id);
    }

    return this.mapDatabaseToResponse(data);
  }

  @withAudit('return', 'create')
  async createReturn(returnData: ReturnCreate, userContext: UserContext): Promise<Return> {
    RBACService.requirePermission(userContext, 'returns', 'create');

    if (userContext.storeId) {
      RBACService.requireStoreAccess(userContext, userContext.storeId);
    }

    const supabase = this.getClient();
    
    // Determine which table to insert into based on return type
    if (returnData.isCustomerReturn) {
      // Insert into after_sales_returns
      const dbReturnData = {
        reason: returnData.reason,
        refund_amount: returnData.refundAmount,
        store_id: userContext.storeId,
        warehouse_id: returnData.warehouseId,
        return_type: returnData.returnType || 'customer_return',
        customer_first: returnData.customerName?.split(' ')[0] || '',
        customer_last: returnData.customerName?.split(' ').slice(1).join(' ') || '',
        customer_email: '', // Not in the interface, set empty
      };

      const { data, error } = await supabase
        .from('after_sales_returns')
        .insert(dbReturnData)
        .select('*')
        .single();

      if (error) {
        throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
      }

      return this.mapAfterSalesReturnToResponse(data);
    } else {
      // Insert into returns
      const dbReturnData = {
        return_number: `RET-${Date.now()}`,
        reason: returnData.reason,
        status: 'pending',
        refund_amount: returnData.refundAmount,
        store_id: userContext.storeId,
        customer_id: returnData.customerId,
        customer_name: returnData.customerName,
        order_id: returnData.orderId,
        items: returnData.items,
        number_of_items: returnData.numberOfItems,
        total_map: returnData.totalMap || 0,
      };

      const { data, error } = await supabase
        .from('returns')
        .insert(dbReturnData)
        .select('*')
        .single();

      if (error) {
        throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
      }

      return this.mapRegularReturnToResponse(data);
    }
  }

  @withAudit('return', 'update')
  async updateReturn(returnId: string, updates: ReturnUpdate, userContext: UserContext): Promise<Return> {
    RBACService.requirePermission(userContext, 'returns', 'update');

    // First verify the return exists and user has access
    const existingReturn = await this.getReturn(returnId, userContext);

    const supabase = this.getClient();
    
    if (existingReturn.isCustomerReturn) {
      // Update after_sales_returns
      const dbUpdates: any = {};
      if (updates.refundAmount !== undefined) dbUpdates.refund_amount = updates.refundAmount;
      if (updates.reason !== undefined) dbUpdates.reason = updates.reason;

      const { data, error } = await supabase
        .from('after_sales_returns')
        .update(dbUpdates)
        .eq('id', returnId)
        .select('*')
        .single();

      if (error) {
        throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
      }

      return this.mapAfterSalesReturnToResponse(data);
    } else {
      // Update returns
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.refundAmount !== undefined) dbUpdates.refund_amount = updates.refundAmount;
      if (updates.reason !== undefined) dbUpdates.reason = updates.reason;

      const { data, error } = await supabase
        .from('returns')
        .update(dbUpdates)
        .eq('id', returnId)
        .select('*')
        .single();

      if (error) {
        throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
      }

      return this.mapRegularReturnToResponse(data);
    }
  }

  private mapDatabaseToResponse(dbReturn: any): Return {
    return {
      id: dbReturn.id,
      returnNumber: dbReturn.return_number,
      reason: dbReturn.reason,
      status: dbReturn.status,
      refundAmount: dbReturn.refund_amount,
      storeId: dbReturn.store_id,
      customerId: dbReturn.customer_id,
      customerName: dbReturn.customer_name,
      orderId: dbReturn.order_id,
      items: dbReturn.items,
      numberOfItems: dbReturn.number_of_items,
      totalMap: dbReturn.total_map,
      isCustomerReturn: dbReturn.is_customer_return,
      returnType: dbReturn.return_type,
      warehouseId: dbReturn.warehouse_id,
      createdAt: dbReturn.created_at,
      updatedAt: dbReturn.updated_at,
    };
  }

  private mapRegularReturnToResponse(dbReturn: any): Return {
    return {
      id: dbReturn.id,
      returnNumber: dbReturn.return_number,
      reason: dbReturn.reason,
      status: dbReturn.status,
      refundAmount: dbReturn.refund_amount,
      storeId: dbReturn.store_id,
      customerId: dbReturn.customer_id,
      customerName: dbReturn.customer_name,
      orderId: dbReturn.order_id,
      items: dbReturn.items,
      numberOfItems: dbReturn.number_of_items,
      totalMap: dbReturn.total_map,
      isCustomerReturn: false,
      returnType: 'REGULAR',
      warehouseId: undefined,
      createdAt: dbReturn.created_at,
      updatedAt: dbReturn.updated_at,
    };
  }

  private mapAfterSalesReturnToResponse(dbReturn: any): Return {
    return {
      id: dbReturn.id,
      returnNumber: undefined,
      reason: dbReturn.reason,
      status: 'pending',
      refundAmount: dbReturn.refund_amount,
      storeId: dbReturn.store_id,
      customerId: undefined,
      customerName: `${dbReturn.customer_first || ''} ${dbReturn.customer_last || ''}`.trim(),
      orderId: undefined,
      items: undefined,
      numberOfItems: 1,
      totalMap: 0,
      isCustomerReturn: true,
      returnType: dbReturn.return_type,
      warehouseId: dbReturn.warehouse_id,
      createdAt: dbReturn.created_at,
      updatedAt: dbReturn.updated_at,
    };
  }
}