// Deno compatible imports will be injected at runtime
import { 
  SalesOrderCreate, 
  SalesOrderResponse, 
  SalesOrderList,
  UserContext,
  PaginationOptions,
  ApiError,
  ErrorCodes 
} from '/packages/shared/src/index.ts';

export class SalesOrdersService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private authToken?: string;

  constructor(supabaseUrl: string, supabaseKey: string, authToken?: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.authToken = authToken;
  }

  private getClient() {
    const createClient = (globalThis as any).createClient;
    return createClient(this.supabaseUrl, this.supabaseKey, {
      global: {
        headers: this.authToken ? { Authorization: this.authToken } : {}
      }
    });
  }

  async getSalesOrders(
    userContext: UserContext,
    options: PaginationOptions & { status?: string },
    canSeeCosts: boolean
  ): Promise<SalesOrderList> {
    const { page, limit, status } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = this.getClient();
    
    let query = supabase
      .from("vw_sales_orders_list")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (userContext.storeId) query = query.eq("store_id", userContext.storeId);

    const { data, error, count } = await query.range(from, to);
    
    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 500, error.message);
    }

    // Filter out cost data for store employees
    const filteredData = data?.map(order => {
      if (!canSeeCosts) {
        const { total_gross_profit, avg_price_map_rate, ...orderWithoutCosts } = order;
        return orderWithoutCosts;
      }
      return order;
    });

    return {
      orders: filteredData?.map(this.mapDatabaseToResponse) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  async getSalesOrder(
    orderId: string,
    userContext: UserContext,
    canSeeCosts: boolean
  ): Promise<SalesOrderResponse> {
    const supabase = this.getClient();
    
    const { data: order, error } = await supabase
      .from("vw_sales_orders_list")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.ORDER_NOT_FOUND, 404, 'Order not found');
    }

    // Get order lines
    const { data: lines } = await supabase
      .from("sales_order_items")
      .select(`
        *,
        products:product_id (
          sku, product_name, brand, model, map_price
        )
      `)
      .eq("sales_order_id", orderId);

    const orderWithLines = {
      ...order,
      lines: lines || []
    };

    // Filter cost data if needed
    if (!canSeeCosts) {
      const { total_gross_profit, avg_price_map_rate, ...orderWithoutCosts } = orderWithLines;
      return this.mapDatabaseToResponse(orderWithoutCosts);
    }

    return this.mapDatabaseToResponse(orderWithLines);
  }

  async createSalesOrder(
    orderData: SalesOrderCreate,
    userContext: UserContext
  ): Promise<SalesOrderResponse> {
    const dbOrderData = {
      order_number: `ORD-${Date.now()}`,
      customer_name: orderData.customerName ?? null,
      customer_email: orderData.customerEmail ?? null,
      customer_phone: orderData.customerPhone ?? null,
      customer_first: orderData.customerFirst ?? null,
      customer_last: orderData.customerLast ?? null,
      addr_country: orderData.addrCountry ?? null,
      addr_state: orderData.addrState ?? null,
      addr_city: orderData.addrCity ?? null,
      addr_street: orderData.addrStreet ?? null,
      addr_zipcode: orderData.addrZipcode ?? null,
      order_date: orderData.orderDate,
      status: orderData.status,
      total_amount: orderData.totalAmount,
      discount_amount: orderData.discountAmount,
      tax_amount: orderData.taxAmount,
      warranty_years: orderData.warrantyYears ?? 1,
      warranty_amount: orderData.warrantyAmount ?? 0,
      walk_in_delivery: orderData.walkInDelivery ?? 'walk-in',
      accessory: orderData.accessory ?? null,
      other_services: orderData.otherServices ?? null,
      other_fee: orderData.otherFee ?? 0,
      delivery_fee: orderData.deliveryFee ?? 0,
      accessory_fee: orderData.accessoryFee ?? 0,
      payment_method_1: orderData.paymentMethod1 ?? null,
      payment_amount_1: orderData.paymentAmount1 ?? 0,
      payment_method_2: orderData.paymentMethod2 ?? null,
      payment_amount_2: orderData.paymentAmount2 ?? 0,
      payment_method_3: orderData.paymentMethod3 ?? null,
      payment_amount_3: orderData.paymentAmount3 ?? 0,
      payment_note: orderData.paymentNote ?? null,
      customer_source: orderData.customerSource ?? null,
      cashier_id: orderData.cashierId ?? null,
      cashier_first: orderData.cashierFirst ?? null,
      cashier_last: orderData.cashierLast ?? null,
      store_id: userContext.storeId,
      created_by: userContext.userId,
    };

    const lineItems = orderData.lines.map((line) => {
      const lineTotal = line.subTotal;
      const full = line.unitPrice * line.quantity;
      const discountAmount = Math.max(0, full - lineTotal);
      
      return {
        product_id: line.productId,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        discount_amount: discountAmount,
        total_amount: lineTotal,
        warranty_years: line.warrantyYears,
        warranty_amount: line.warrantyAmount,
        map_at_sale: line.mapPrice,
        price_map_rate: line.priceMapRate,
        unit_cost_at_sale: line.unitCostAtSale,
        gross_profit: line.grossProfit,
      };
    });

    const supabase = this.getClient();
    
    // Use stock deduction function for submitted orders
    if (orderData.status === "submitted") {
      const { data, error } = await supabase.rpc(
        "create_sales_order_with_stock_deduction",
        { 
          order_data: dbOrderData, 
          line_items: lineItems 
        }
      );
      
      if (error) {
        throw new ApiError(ErrorCodes.INSUFFICIENT_STOCK, 400, error.message);
      }
      
      return this.mapDatabaseToResponse((data as any)?.[0] ?? data);
    }

    // Simple insert for draft orders
    const { data: order, error } = await supabase
      .from("sales_orders")
      .insert(dbOrderData)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
    }

    const items = lineItems.map(item => ({
      ...item,
      sales_order_id: (order as any).id
    }));

    const { error: itemErr } = await supabase
      .from("sales_order_items")
      .insert(items);

    if (itemErr) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, itemErr.message);
    }

    return this.mapDatabaseToResponse(order);
  }

  private mapDatabaseToResponse(dbOrder: any): SalesOrderResponse {
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.order_number,
      orderDate: dbOrder.order_date,
      status: dbOrder.status,
      totalAmount: dbOrder.total_amount,
      customerName: dbOrder.customer_name,
      customerFirst: dbOrder.customer_first,
      customerLast: dbOrder.customer_last,
      totalGrossProfit: dbOrder.total_gross_profit,
      avgPriceMapRate: dbOrder.avg_price_map_rate,
      lines: dbOrder.lines,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
    };
  }
}