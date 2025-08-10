// Store management service
import { UserContext, PaginationOptions, ApiError, ErrorCodes } from '/packages/shared/src/index.ts';
import { RBACService } from '../rbac.ts';
import { AuditLogger, withAudit } from '../audit.ts';

export interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  address?: string;
  phone?: string;
  region?: string;
  status: 'active' | 'inactive';
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreCreate {
  storeCode: string;
  storeName: string;
  address?: string;
  phone?: string;
  region?: string;
  managerId?: string;
}

export interface StoreUpdate {
  storeName?: string;
  address?: string;
  phone?: string;
  region?: string;
  status?: 'active' | 'inactive';
  managerId?: string;
}

export interface StoreList {
  stores: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export class StoreService {
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

  async getStores(
    userContext: UserContext,
    options: PaginationOptions & { region?: string }
  ): Promise<StoreList> {
    RBACService.requirePermission(userContext, 'stores', 'read');

    const { page, limit, region } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = this.getClient();
    
    let query = supabase
      .from('stores')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (region) {
      query = query.eq('region', region);
    }

    // Store employees/managers can only see their own store
    if (userContext.role !== 'hq_admin' && userContext.storeId) {
      query = query.eq('id', userContext.storeId);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 500, error.message);
    }

    const stores = data?.map(this.mapDatabaseToResponse) || [];

    return {
      stores,
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  async getStore(storeId: string, userContext: UserContext): Promise<Store> {
    RBACService.requirePermission(userContext, 'stores', 'read');
    RBACService.requireStoreAccess(userContext, storeId);

    const supabase = this.getClient();
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.STORE_NOT_FOUND, 404, 'Store not found');
    }

    return this.mapDatabaseToResponse(data);
  }

  @withAudit('store', 'create')
  async createStore(storeData: StoreCreate, userContext: UserContext): Promise<Store> {
    RBACService.requirePermission(userContext, 'stores', 'create');

    const supabase = this.getClient();
    
    const dbStoreData = {
      store_code: storeData.storeCode,
      store_name: storeData.storeName,
      address: storeData.address,
      phone: storeData.phone,
      region: storeData.region,
      manager_id: storeData.managerId,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('stores')
      .insert(dbStoreData)
      .select('*')
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
    }

    return this.mapDatabaseToResponse(data);
  }

  @withAudit('store', 'update')
  async updateStore(storeId: string, updates: StoreUpdate, userContext: UserContext): Promise<Store> {
    RBACService.requirePermission(userContext, 'stores', 'update');
    RBACService.requireStoreAccess(userContext, storeId);

    const supabase = this.getClient();
    
    const dbUpdates: any = {};
    if (updates.storeName !== undefined) dbUpdates.store_name = updates.storeName;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.region !== undefined) dbUpdates.region = updates.region;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;

    const { data, error } = await supabase
      .from('stores')
      .update(dbUpdates)
      .eq('id', storeId)
      .select('*')
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
    }

    return this.mapDatabaseToResponse(data);
  }

  private mapDatabaseToResponse(dbStore: any): Store {
    return {
      id: dbStore.id,
      storeCode: dbStore.store_code,
      storeName: dbStore.store_name,
      address: dbStore.address,
      phone: dbStore.phone,
      region: dbStore.region,
      status: dbStore.status,
      managerId: dbStore.manager_id,
      createdAt: dbStore.created_at,
      updatedAt: dbStore.updated_at,
    };
  }
}