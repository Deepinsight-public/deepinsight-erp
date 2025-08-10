import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Customer, 
  CustomerCreate, 
  CustomerList,
  CustomerInteractions,
  UserContext,
  PaginationOptions,
  ApiError,
  ErrorCodes 
} from '@erp/shared';

export class CustomersService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string, authToken?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authToken ? { Authorization: authToken } : {}
      }
    });
  }

  async getCustomers(
    userContext: UserContext,
    options: PaginationOptions & { search?: string }
  ): Promise<CustomerList> {
    const { page, limit, search } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (userContext.storeId) {
      query = query.eq("store_id", userContext.storeId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,customer_code.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 500, error.message);
    }

    return {
      customers: data?.map(this.mapDatabaseToResponse) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  async getCustomer(customerId: string, userContext: UserContext): Promise<Customer> {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .eq("store_id", userContext.storeId || '')
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.CUSTOMER_NOT_FOUND, 404, 'Customer not found');
    }

    return this.mapDatabaseToResponse(data);
  }

  async createCustomer(
    customerData: CustomerCreate,
    userContext: UserContext
  ): Promise<Customer> {
    const dbCustomerData = {
      ...customerData,
      customer_code: `CUST-${Date.now()}`,
      store_id: userContext.storeId,
      created_by: userContext.userId,
    };

    const { data, error } = await this.supabase
      .from("customers")
      .insert(dbCustomerData)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
    }

    return this.mapDatabaseToResponse(data);
  }

  async getCustomerInteractions(
    customerId: string,
    userContext: UserContext
  ): Promise<CustomerInteractions> {
    // Verify customer belongs to user's store
    await this.getCustomer(customerId, userContext);

    // Get customer's sales orders, returns, and repairs
    const [ordersRes, returnsRes, repairsRes] = await Promise.all([
      this.supabase
        .from("sales_orders")
        .select("id, order_number, order_date, total_amount, status")
        .eq("customer_id", customerId),
      this.supabase
        .from("returns")
        .select("id, return_number, return_date, total_amount, status")
        .eq("customer_id", customerId),
      this.supabase
        .from("repairs")
        .select("id, repair_number, created_at, status, estimated_cost")
        .eq("customer_id", customerId)
    ]);

    return {
      orders: ordersRes.data?.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        orderDate: order.order_date,
        totalAmount: order.total_amount,
        status: order.status,
      })) || [],
      returns: returnsRes.data?.map(returnItem => ({
        id: returnItem.id,
        returnNumber: returnItem.return_number,
        returnDate: returnItem.return_date,
        totalAmount: returnItem.total_amount,
        status: returnItem.status,
      })) || [],
      repairs: repairsRes.data?.map(repair => ({
        id: repair.id,
        repairNumber: repair.repair_number,
        createdAt: repair.created_at,
        status: repair.status,
        estimatedCost: repair.estimated_cost,
      })) || [],
    };
  }

  private mapDatabaseToResponse(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      customerCode: dbCustomer.customer_code,
      name: dbCustomer.name,
      email: dbCustomer.email,
      phone: dbCustomer.phone,
      address: dbCustomer.address,
      city: dbCustomer.city,
      state: dbCustomer.state,
      zipcode: dbCustomer.zipcode,
      country: dbCustomer.country,
      status: dbCustomer.status,
      totalOrders: dbCustomer.total_orders || 0,
      totalSpent: dbCustomer.total_spent || 0,
      storeId: dbCustomer.store_id,
      createdAt: dbCustomer.created_at,
      updatedAt: dbCustomer.updated_at,
    };
  }
}