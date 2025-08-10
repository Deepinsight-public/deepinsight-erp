// Edge Function: Comprehensive Store API with DTO Validation and Field Mapping
// Handles all store API routes with new service layer integration

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...extraHeaders },
  });
}

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } });
}

function getSupabaseClient(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("Supabase env not configured");
  const authHeader = req.headers.get("Authorization") || "";
  return createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
}

// Get user context with role and store
async function getUserContext(req: Request) {
  const supabase = getSupabaseClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, store_id, full_name')
    .eq('user_id', user.id)
    .single();
    
  return { user, profile };
}

// Check if user can see cost/profit data (exclude store employees)
function canSeeCostData(role: string) {
  return role === 'hq_admin' || role === 'store_manager';
}

// DTO Schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const salesOrderLineSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  productName: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  subTotal: z.number().nonnegative(),
});

const salesOrderSchema = z.object({
  orderDate: z.string(),
  orderType: z.enum(["retail", "wholesale"]).optional().default("retail"),
  status: z.enum(["draft", "submitted", "pending", "confirmed", "shipped", "completed", "cancelled"]),
  subTotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  lines: z.array(salesOrderLineSchema).min(1),
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerFirst: z.string().optional(),
  customerLast: z.string().optional(),
  addrCountry: z.string().optional(),
  addrState: z.string().optional(),
  addrCity: z.string().optional(),
  addrStreet: z.string().optional(),
  addrZipcode: z.string().optional(),
  warrantyYears: z.number().int().optional(),
  warrantyAmount: z.number().optional(),
  walkInDelivery: z.string().optional(),
  accessory: z.string().optional(),
  otherServices: z.string().optional(),
  otherFee: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentNote: z.string().optional(),
  customerSource: z.string().optional(),
  cashierId: z.string().uuid().optional(),
});

const purchaseRequestSchema = z.object({
  storeId: z.string().uuid(),
  remarks: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1)
});

const transferOrderSchema = z.object({
  toStoreId: z.string().uuid(),
  reason: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    epc: z.string()
  })).min(1)
});

const returnOrderSchema = z.object({
  originalOrderId: z.string().uuid(),
  isCustomerReturn: z.boolean().optional().default(false),
  returnWHId: z.string().uuid().optional(),
  lines: z.array(z.object({
    originalLineId: z.string().uuid(),
    itemId: z.string().uuid(),
    reason: z.string()
  })).min(1)
});

const scanEpcSchema = z.object({
  epc: z.string(),
  action: z.string()
});

// Route handlers
async function handleAuth(req: Request, pathname: string) {
  const supabase = getSupabaseClient(req);
  
  if (pathname === "/api/store/auth/login" && req.method === "POST") {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Invalid credentials format" }, 400);
    
    const { email, password } = parsed.data;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) return json({ error: error.message }, 401);
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id, full_name')
      .eq('user_id', data.user.id)
      .single();
    
    const [firstName, ...lastNameParts] = (profile?.full_name || '').split(' ');
    const lastName = lastNameParts.join(' ');
    
    return json({
      user: data.user,
      session: data.session,
      profile: {
        firstName,
        lastName,
        role: profile?.role,
        storeId: profile?.store_id
      }
    });
  }
  
  if (pathname === "/api/store/auth/logout" && req.method === "POST") {
    const { error } = await supabase.auth.signOut();
    if (error) return json({ error: error.message }, 400);
    return json({ success: true });
  }
  
  return null;
}

async function handleSalesOrders(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile } = userContext;
  const canSeeCosts = canSeeCostData(profile?.role || '');
  
  // GET /api/store/sales-orders
  if (req.method === "GET" && pathname === "/api/store/sales-orders") {
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status") ?? "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("vw_sales_orders_list").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (profile?.store_id) query = query.eq("store_id", profile.store_id);

    const { data, error, count } = await query.range(from, to);
    if (error) return json({ error: error.message }, 500);

    // Filter out cost data for store employees
    const filteredData = data?.map(order => {
      if (!canSeeCosts) {
        const { total_gross_profit, avg_price_map_rate, ...orderWithoutCosts } = order;
        return orderWithoutCosts;
      }
      return order;
    });

    const headers = { "X-Total-Count": String(count ?? 0) };
    return json(filteredData ?? [], 200, headers);
  }
  
  // GET /api/store/sales-orders/:id
  if (req.method === "GET" && pathname.match(/^\/api\/store\/sales-orders\/[^\/]+$/)) {
    const orderId = pathname.split('/').pop();
    
    const { data: order, error } = await supabase
      .from("vw_sales_orders_list")
      .select("*")
      .eq("id", orderId)
      .single();
      
    if (error) return json({ error: "Order not found" }, 404);
    
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
      return json(orderWithoutCosts);
    }
    
    return json(orderWithLines);
  }
  
  // POST /api/store/sales-orders
  if (req.method === "POST" && pathname === "/api/store/sales-orders") {
    const payload = await req.json().catch(() => null);
    const parsed = salesOrderSchema.safeParse(payload);
    if (!parsed.success) return json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    
    const input = parsed.data;
    const { user } = userContext;

    const orderData = {
      order_number: `ORD-${Date.now()}`, // Generate order number
      customer_name: input.customerName ?? null,
      customer_email: input.customerEmail ?? null,
      customer_phone: input.customerPhone ?? null,
      customer_first: input.customerFirst ?? null,
      customer_last: input.customerLast ?? null,
      addr_country: input.addrCountry ?? null,
      addr_state: input.addrState ?? null,
      addr_city: input.addrCity ?? null,
      addr_street: input.addrStreet ?? null,
      addr_zipcode: input.addrZipcode ?? null,
      order_date: input.orderDate,
      status: input.status,
      total_amount: input.totalAmount,
      discount_amount: input.discountAmount,
      tax_amount: input.taxAmount,
      warranty_years: input.warrantyYears ?? 1,
      warranty_amount: input.warrantyAmount ?? 0,
      walk_in_delivery: input.walkInDelivery ?? 'walk-in',
      accessory: input.accessory ?? null,
      other_services: input.otherServices ?? null,
      other_fee: input.otherFee ?? 0,
      payment_method: input.paymentMethod ?? null,
      payment_note: input.paymentNote ?? null,
      customer_source: input.customerSource ?? null,
      cashier_id: input.cashierId ?? null,
      store_id: profile?.store_id,
      created_by: user.id,
    };

    const lineItems = input.lines.map((l) => {
      const lineTotal = l.subTotal;
      const full = l.unitPrice * l.quantity;
      const discountAmount = Math.max(0, full - lineTotal);
      return {
        product_id: l.productId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        discount_amount: discountAmount,
        total_amount: lineTotal,
      };
    });

    // Use stock deduction function for submitted orders
    if (input.status === "submitted") {
      const { data, error } = await supabase.rpc("create_sales_order_with_stock_deduction", { 
        order_data: orderData, 
        line_items: lineItems 
      });
      if (error) return json({ error: error.message }, 400);
      return json((data as any)?.[0] ?? data, 201);
    }

    // Simple insert for draft orders
    const { data: order, error } = await supabase.from("sales_orders").insert(orderData).select("*").single();
    if (error) return json({ error: error.message }, 400);

    const items = lineItems.map(item => ({
      ...item,
      sales_order_id: (order as any).id
    }));
    
    const { error: itemErr } = await supabase.from("sales_order_items").insert(items);
    if (itemErr) return json({ error: itemErr.message }, 400);

    return json(order, 201);
  }
  
  return null;
}

async function handleCustomers(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile } = userContext;
  
  // GET /api/store/customers
  if (req.method === "GET" && pathname === "/api/store/customers") {
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("customers").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (profile?.store_id) query = query.eq("store_id", profile.store_id);
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,customer_code.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query.range(from, to);
    if (error) return json({ error: error.message }, 500);

    const headers = { "X-Total-Count": String(count ?? 0) };
    return json(data ?? [], 200, headers);
  }
  
  // GET /api/store/customers/:id/interactions
  if (req.method === "GET" && pathname.match(/^\/api\/store\/customers\/[^\/]+\/interactions$/)) {
    const customerId = pathname.split('/')[4]; // Extract customer ID
    
    // Get customer's sales orders, returns, and repairs
    const [ordersRes, returnsRes, repairsRes] = await Promise.all([
      supabase.from("sales_orders").select("*").eq("customer_id", customerId),
      supabase.from("returns").select("*").eq("customer_id", customerId),
      supabase.from("repairs").select("*").eq("customer_id", customerId)
    ]);
    
    return json({
      orders: ordersRes.data ?? [],
      returns: returnsRes.data ?? [],
      repairs: repairsRes.data ?? []
    });
  }
  
  return null;
}

async function handleInventory(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile } = userContext;
  
  // GET /api/store/inventory
  if (req.method === "GET" && pathname === "/api/store/inventory") {
    const search = searchParams.get("search") ?? "";
    
    let query = supabase.from("vw_inventory").select("*");
    if (profile?.store_id) query = query.eq("store_id", profile.store_id);
    if (search) {
      query = query.or(`sku.ilike.%${search}%,kw_code.ilike.%${search}%,model.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);
    
    return json(data ?? []);
  }
  
  return null;
}

async function handlePurchaseRequests(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile, user } = userContext;
  
  // GET /api/store/purchase-requests
  if (req.method === "GET" && pathname === "/api/store/purchase-requests") {
    let query = supabase.from("purchase_requests").select("*");
    if (profile?.store_id) query = query.eq("store_id", profile.store_id);
    
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    
    return json(data ?? []);
  }
  
  // POST /api/store/purchase-requests
  if (req.method === "POST" && pathname === "/api/store/purchase-requests") {
    const payload = await req.json().catch(() => null);
    const parsed = purchaseRequestSchema.safeParse(payload);
    if (!parsed.success) return json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    
    const input = parsed.data;
    
    // Generate allocation ID
    const allocationId = crypto.randomUUID();
    
    const requestData = {
      allocation_id: allocationId,
      store_id: input.storeId,
      warehouse_id: '00000000-0000-0000-0000-000000000001', // Default warehouse
      status: 'pending',
      items: input.lines
    };
    
    const { data, error } = await supabase.from("purchase_requests").insert(requestData).select("*").single();
    if (error) return json({ error: error.message }, 400);
    
    return json(data, 201);
  }
  
  return null;
}

async function handleTransfers(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile, user } = userContext;
  
  // GET /api/store/inventory/transfer-in
  if (req.method === "GET" && pathname === "/api/store/inventory/transfer-in") {
    let query = supabase.from("TransferOrder").select("*, TransferLine(*)").eq("toStoreId", profile?.store_id || '');
    
    const { data, error } = await query.order("createdAt", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    
    return json(data ?? []);
  }
  
  // GET /api/store/inventory/transfer-out  
  if (req.method === "GET" && pathname === "/api/store/inventory/transfer-out") {
    let query = supabase.from("TransferOrder").select("*, TransferLine(*)").eq("fromStoreId", profile?.store_id || '');
    
    const { data, error } = await query.order("createdAt", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    
    return json(data ?? []);
  }
  
  // POST /api/store/inventory/transfer-out
  if (req.method === "POST" && pathname === "/api/store/inventory/transfer-out") {
    const payload = await req.json().catch(() => null);
    const parsed = transferOrderSchema.safeParse(payload);
    if (!parsed.success) return json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    
    const input = parsed.data;
    
    // Determine transfer kind
    const toStoreType = await supabase.from("stores").select("store_code").eq("id", input.toStoreId).single();
    let kind = 'STORE_TO_STORE';
    if (toStoreType.data?.store_code?.startsWith('HQ')) {
      kind = 'STORE_TO_HQ';
    }
    
    const transferData = {
      docNo: `TF-${Date.now()}`,
      kind,
      fromStoreId: profile?.store_id || '',
      toStoreId: input.toStoreId,
      reason: input.reason || null,
      status: 'DRAFT',
      createdById: user.id
    };
    
    const { data: transfer, error } = await supabase.from("TransferOrder").insert(transferData).select("*").single();
    if (error) return json({ error: error.message }, 400);
    
    // Add transfer lines
    const lines = input.items.map(item => ({
      orderId: (transfer as any).id,
      itemId: item.itemId
    }));
    
    const { error: linesError } = await supabase.from("TransferLine").insert(lines);
    if (linesError) return json({ error: linesError.message }, 400);
    
    return json(transfer, 201);
  }
  
  // POST /api/store/transfers/:id/ship
  if (req.method === "POST" && pathname.match(/^\/api\/store\/transfers\/[^\/]+\/ship$/)) {
    const transferId = pathname.split('/')[4];
    
    // Update transfer status
    const { error: updateError } = await supabase
      .from("TransferOrder")
      .update({ status: 'SHIPPED' })
      .eq("id", transferId);
    
    if (updateError) return json({ error: updateError.message }, 400);
    
    // Update item statuses and create scan logs
    const { data: lines } = await supabase
      .from("TransferLine")
      .select("itemId, Item(*)")
      .eq("orderId", transferId);
    
    for (const line of lines || []) {
      // Update item status
      await supabase
        .from("Item")
        .update({ status: 'in_transit' })
        .eq("id", line.itemId);
      
      // Create scan log
      await supabase.from("ScanLog").insert({
        itemId: line.itemId,
        epc: (line as any).Item.epc,
        action: 'TRANSFER_SHIP',
        storeId: profile?.store_id,
        docType: 'TRANSFER',
        docId: transferId,
        createdById: user.id
      });
      
      // Create item event
      await supabase.from("ItemEvent").insert({
        itemId: line.itemId,
        type: 'TRANSFER_SHIPPED',
        docType: 'TRANSFER',
        docId: transferId,
        storeId: profile?.store_id,
        payload: { transferId, action: 'shipped' },
        createdById: user.id
      });
    }
    
    return json({ success: true });
  }
  
  // POST /api/store/transfers/:id/receive
  if (req.method === "POST" && pathname.match(/^\/api\/store\/transfers\/[^\/]+\/receive$/)) {
    const transferId = pathname.split('/')[4];
    
    // Get transfer info
    const { data: transfer } = await supabase
      .from("TransferOrder")
      .select("*")
      .eq("id", transferId)
      .single();
    
    if (!transfer) return json({ error: "Transfer not found" }, 404);
    
    // Update transfer status
    await supabase
      .from("TransferOrder")
      .update({ status: 'RECEIVED' })
      .eq("id", transferId);
    
    // Update items and create tracking
    const { data: lines } = await supabase
      .from("TransferLine")
      .select("itemId, Item(*)")
      .eq("orderId", transferId);
    
    for (const line of lines || []) {
      // Update item location and status
      await supabase
        .from("Item")
        .update({ 
          status: 'in_stock',
          currentStoreId: (transfer as any).toStoreId
        })
        .eq("id", line.itemId);
      
      // Create scan log
      await supabase.from("ScanLog").insert({
        itemId: line.itemId,
        epc: (line as any).Item.epc,
        action: 'TRANSFER_RECEIVE',
        storeId: (transfer as any).toStoreId,
        docType: 'TRANSFER',
        docId: transferId,
        createdById: user.id
      });
      
      // Create item event
      await supabase.from("ItemEvent").insert({
        itemId: line.itemId,
        type: 'TRANSFER_RECEIVED',
        docType: 'TRANSFER',
        docId: transferId,
        storeId: (transfer as any).toStoreId,
        payload: { transferId, action: 'received' },
        createdById: user.id
      });
    }
    
    return json({ success: true });
  }
  
  return null;
}

async function handleReturns(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile, user } = userContext;
  
  // GET /api/store/after-sales/returns
  if (req.method === "GET" && pathname === "/api/store/after-sales/returns") {
    let query = supabase.from("vw_returns_unified").select("*");
    if (profile?.store_id) query = query.eq("store_id", profile.store_id);
    
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    
    return json(data ?? []);
  }
  
  // GET /api/store/customer-returns
  if (req.method === "GET" && pathname === "/api/store/customer-returns") {
    let query = supabase.from("vw_returns_unified").select("*").eq("is_customer_return", true);
    if (profile?.store_id) query = query.eq("store_id", profile.store_id);
    
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    
    return json(data ?? []);
  }
  
  // GET /api/store/hq-returns
  if (req.method === "GET" && pathname === "/api/store/hq-returns") {
    let query = supabase.from("vw_returns_unified").select("*").not("return_wh_id", "is", null);
    if (profile?.store_id) query = query.eq("store_id", profile.store_id);
    
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    
    return json(data ?? []);
  }
  
  // GET /api/store/after-sales/returns/:id
  if (req.method === "GET" && pathname.match(/^\/api\/store\/after-sales\/returns\/[^\/]+$/)) {
    const returnId = pathname.split('/').pop();
    
    const { data: returnOrder, error } = await supabase
      .from("ReturnOrder")
      .select(`
        *,
        ReturnLine (
          *,
          Item (*)
        )
      `)
      .eq("id", returnId)
      .single();
      
    if (error) return json({ error: "Return not found" }, 404);
    
    return json(returnOrder);
  }
  
  // POST /api/store/after-sales/returns
  if (req.method === "POST" && pathname === "/api/store/after-sales/returns") {
    const payload = await req.json().catch(() => null);
    const parsed = returnOrderSchema.safeParse(payload);
    if (!parsed.success) return json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
    
    const input = parsed.data;
    
    const returnData = {
      docNo: `RET-${Date.now()}`,
      storeId: profile?.store_id || '',
      originalOrderId: input.originalOrderId,
      isCustomerReturn: input.isCustomerReturn,
      returnWHId: input.returnWHId || null,
      status: 'DRAFT',
      refundMode: 'ADJUSTED_PRICE',
      createdById: user.id
    };
    
    const { data: returnOrder, error } = await supabase.from("ReturnOrder").insert(returnData).select("*").single();
    if (error) return json({ error: error.message }, 400);
    
    // Add return lines
    const lines = input.lines.map(line => ({
      orderId: (returnOrder as any).id,
      originalLineId: line.originalLineId,
      itemId: line.itemId,
      reason: line.reason,
      restockStatus: 'PENDING'
    }));
    
    const { error: linesError } = await supabase.from("ReturnLine").insert(lines);
    if (linesError) return json({ error: linesError.message }, 400);
    
    return json(returnOrder, 201);
  }
  
  // POST /api/store/after-sales/returns/:id/receive
  if (req.method === "POST" && pathname.match(/^\/api\/store\/after-sales\/returns\/[^\/]+\/receive$/)) {
    const returnId = pathname.split('/')[5];
    
    const { error } = await supabase
      .from("ReturnOrder")
      .update({ 
        status: 'RECEIVED',
        updatedAt: new Date().toISOString()
      })
      .eq("id", returnId);
    
    if (error) return json({ error: error.message }, 400);
    
    // Update return lines to received status but keep PENDING restock status
    await supabase
      .from("ReturnLine")
      .update({ 
        receivedById: user.id,
        receivedOn: new Date().toISOString()
      })
      .eq("orderId", returnId);
    
    return json({ success: true });
  }
  
  // POST /api/store/after-sales/returns/:id/restock-line/:lineId
  if (req.method === "POST" && pathname.match(/^\/api\/store\/after-sales\/returns\/[^\/]+\/restock-line\/[^\/]+$/)) {
    const pathParts = pathname.split('/');
    const returnId = pathParts[5];
    const lineId = pathParts[7];
    
    const payload = await req.json().catch(() => null);
    const parsed = scanEpcSchema.safeParse(payload);
    if (!parsed.success) return json({ error: "Invalid EPC scan data" }, 400);
    
    const { epc } = parsed.data;
    
    // Verify EPC matches the item in the return line
    const { data: returnLine } = await supabase
      .from("ReturnLine")
      .select("*, Item(*)")
      .eq("id", lineId)
      .eq("orderId", returnId)
      .single();
    
    if (!returnLine) return json({ error: "Return line not found" }, 404);
    
    if ((returnLine as any).Item.epc !== epc) {
      return json({ error: "EPC does not match item in return" }, 400);
    }
    
    // Update return line to IN_STOCK (trigger will handle item update)
    const { error } = await supabase
      .from("ReturnLine")
      .update({
        restockStatus: 'IN_STOCK',
        restockedOn: new Date().toISOString(),
        restockedById: user.id
      })
      .eq("id", lineId);
    
    if (error) return json({ error: error.message }, 400);
    
    // Create scan log
    await supabase.from("ScanLog").insert({
      itemId: (returnLine as any).itemId,
      epc,
      action: 'RETURN_RESTOCK',
      storeId: profile?.store_id,
      docType: 'RETURN',
      docId: returnId,
      createdById: user.id
    });
    
    return json({ success: true, message: "Item restocked successfully" });
  }
  
  return null;
}

async function handleDashboard(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile } = userContext;
  
  // GET /api/store/dashboard
  if (req.method === "GET" && pathname === "/api/store/dashboard") {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Today's sales data
      const { data: todaySales } = await supabase
        .from('vw_sales_summary')
        .select('transaction_amount, total_quantity')
        .eq('store_id', profile?.store_id)
        .eq('order_date', today);

      const todaysSalesAmount = todaySales?.reduce((sum, order) => sum + (order.transaction_amount || 0), 0) || 0;
      const todaysOrderCount = todaySales?.length || 0;

      // Inventory warnings (items below reorder point)
      const { data: inventoryWarnings } = await supabase
        .from('inventory')
        .select('product_id, quantity, reorder_point, products(product_name)')
        .eq('store_id', profile?.store_id)
        .filter('quantity', 'lt', 'reorder_point');

      // Pending transfers to receive
      const { data: pendingTransfers } = await supabase
        .from('TransferOrder')
        .select('*')
        .eq('toStoreId', profile?.store_id?.toString())
        .eq('status', 'SHIPPED');

      // Pending returns to restock
      const { data: pendingReturns } = await supabase
        .from('ReturnLine')
        .select('*')
        .eq('restockStatus', 'PENDING')
        .neq('receivedById', null);

      // Pending scrap approvals
      const { data: pendingScrap } = await supabase
        .from('scrap_headers')
        .select('*')
        .eq('store_id', profile?.store_id)
        .eq('status', 'draft');

      const dashboardData = {
        todaysSales: {
          amount: todaysSalesAmount,
          orderCount: todaysOrderCount
        },
        inventoryWarnings: {
          count: inventoryWarnings?.length || 0,
          items: inventoryWarnings || []
        },
        pendingTasks: {
          transfersToReceive: pendingTransfers?.length || 0,
          returnsToRestock: pendingReturns?.length || 0,
          scrapToApprove: pendingScrap?.length || 0
        }
      };

      return json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return json({ error: error.message }, 500);
    }
  }
  
  return null;
}

async function handlePivot(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile } = userContext;
  
  // GET /api/store/sales-orders/pivot
  if (req.method === "GET" && pathname === "/api/store/sales-orders/pivot") {
    try {
      const source = searchParams.get('source');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const groupBy = searchParams.get('groupBy') || 'order_date';

      let query = supabase
        .from('vw_sales_summary')
        .select('*')
        .eq('store_id', profile?.store_id);

      // Apply filters
      if (source) {
        query = query.eq('source', source);
      }
      if (dateFrom) {
        query = query.gte('order_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('order_date', dateTo);
      }

      const { data, error } = await query.order('order_date', { ascending: false });

      if (error) throw error;

      return json({ data: data || [] });
    } catch (error) {
      console.error('Error fetching pivot data:', error);
      return json({ error: error.message }, 500);
    }
  }
  
  return null;
}

async function handleHistory(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile } = userContext;
  
  // GET /api/store/sales-orders/history
  if (req.method === "GET" && pathname === "/api/store/sales-orders/history") {
    try {
      const orderId = searchParams.get('orderId');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      // Get item events related to sales orders
      let itemEventsQuery = supabase
        .from('ItemEvent')
        .select('*')
        .eq('storeId', profile?.store_id?.toString())
        .eq('docType', 'SALES_ORDER');

      if (orderId) {
        itemEventsQuery = itemEventsQuery.eq('docId', orderId);
      }
      if (dateFrom) {
        itemEventsQuery = itemEventsQuery.gte('createdAt', dateFrom);
      }
      if (dateTo) {
        itemEventsQuery = itemEventsQuery.lte('createdAt', dateTo);
      }

      const { data: itemEvents, error: itemEventsError } = await itemEventsQuery
        .order('createdAt', { ascending: false });

      if (itemEventsError) throw itemEventsError;

      // Get sales order changes
      let ordersQuery = supabase
        .from('sales_orders')
        .select('*')
        .eq('store_id', profile?.store_id);

      if (orderId) {
        ordersQuery = ordersQuery.eq('id', orderId);
      }
      if (dateFrom) {
        ordersQuery = ordersQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        ordersQuery = ordersQuery.lte('created_at', dateTo);
      }

      const { data: orders, error: ordersError } = await ordersQuery
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const historyData = {
        orders: orders || [],
        itemEvents: itemEvents || [],
        // TODO: Add audit logs when audit table is implemented
        auditLogs: []
      };

      return json(historyData);
    } catch (error) {
      console.error('Error fetching history data:', error);
      return json({ error: error.message }, 500);
    }
  }
  
  return null;
}

async function handleScrap(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile, user } = userContext;
  
  // POST /api/store/scrap - Create scrap with photo uploads
  if (req.method === "POST" && (pathname === "/api/store/scrap" || pathname === "/api/store/after-sales/scrap")) {
    try {
      const formData = await req.formData();
      const dataStr = formData.get('data') as string;
      const files = formData.getAll('photos') as File[];
      
      if (!dataStr) {
        return json({ error: "Missing scrap data" }, 400);
      }
      
      const scrapData = JSON.parse(dataStr);
      
      // Create scrap header
      const { data: scrapHeader, error: headerError } = await supabase
        .from('scrap_headers')
        .insert({
          scrap_no: `SCR-${Date.now()}`,
          store_id: profile?.store_id,
          warehouse_id: profile?.store_id, // Use store as warehouse for now
          status: 'draft',
          total_qty: scrapData.total_qty || 0,
          total_value: scrapData.total_value || 0,
          created_by: user.id
        })
        .select()
        .single();
      
      if (headerError) {
        return json({ error: headerError.message }, 400);
      }
      
      // Upload photos if provided
      let photoUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${scrapHeader.id}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('scrap-photos')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }
          
          // Get signed URL
          const { data: signedData } = await supabase.storage
            .from('scrap-photos')
            .createSignedUrl(uploadData.path, 7 * 24 * 60 * 60); // 7 days
          
          if (signedData?.signedUrl) {
            photoUrls.push(signedData.signedUrl);
          }
        }
        
        // Update scrap header with photo URLs
        await supabase
          .from('scrap_headers')
          .update({ photo_urls: photoUrls })
          .eq('id', scrapHeader.id);
      }
      
      return json({ ...scrapHeader, photo_urls: photoUrls }, 201);
    } catch (error) {
      console.error('Scrap creation error:', error);
      return json({ error: 'Failed to create scrap record' }, 500);
    }
  }
  
  return null;
}

async function handleRepairs(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile, user } = userContext;
  
  // POST /api/store/repairs - Create repair with document upload
  if (req.method === "POST" && pathname === "/api/store/repairs") {
    try {
      const formData = await req.formData();
      const dataStr = formData.get('data') as string;
      const documentFile = formData.get('document') as File;
      
      if (!dataStr) {
        return json({ error: "Missing repair data" }, 400);
      }
      
      const repairData = JSON.parse(dataStr);
      
      // Create repair record
      const { data: repair, error: repairError } = await supabase
        .from('repairs')
        .insert({
          repair_id: `R-${Date.now()}`,
          store_id: profile?.store_id,
          customer_id: repairData.customer_id,
          product_id: repairData.product_id,
          customer_name: repairData.customer_name,
          type: repairData.type,
          description: repairData.description,
          status: 'pending',
          cost: repairData.cost,
          estimated_completion: repairData.estimated_completion
        })
        .select()
        .single();
      
      if (repairError) {
        return json({ error: repairError.message }, 400);
      }
      
      // Upload document if provided
      let documentUrl: string | null = null;
      if (documentFile) {
        const fileExt = documentFile.name.split('.').pop();
        const fileName = `repair-doc-${Date.now()}.${fileExt}`;
        const filePath = `${repair.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('repair-docs')
          .upload(filePath, documentFile);
        
        if (!uploadError && uploadData) {
          // Get signed URL
          const { data: signedData } = await supabase.storage
            .from('repair-docs')
            .createSignedUrl(uploadData.path, 7 * 24 * 60 * 60); // 7 days
          
          if (signedData?.signedUrl) {
            documentUrl = signedData.signedUrl;
            
            // Update repair with document URL
            await supabase
              .from('repairs')
              .update({ document_url: documentUrl })
              .eq('id', repair.id);
          }
        }
      }
      
      return json({ ...repair, document_url: documentUrl }, 201);
    } catch (error) {
      console.error('Repair creation error:', error);
      return json({ error: 'Failed to create repair record' }, 500);
    }
  }
  
  return null;
}

async function handleLogistics(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile, user } = userContext;
  
  // PUT /api/store/logistics/lines/:id - Update logistics line with proof upload
  if (req.method === "PUT" && pathname.match(/^\/api\/store\/logistics\/lines\/[^\/]+$/)) {
    try {
      const lineId = pathname.split('/').pop();
      const formData = await req.formData();
      const proofFile = formData.get('proof') as File;
      const status = formData.get('status') as string;
      
      if (!proofFile) {
        return json({ error: "Missing proof file" }, 400);
      }
      
      // Get logistics line
      const { data: logisticsLine, error: lineError } = await supabase
        .from('logistics_lines')
        .select('*, sales_orders!inner(store_id)')
        .eq('id', lineId)
        .single();
      
      if (lineError || !logisticsLine) {
        return json({ error: "Logistics line not found" }, 404);
      }
      
      // Upload proof file
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `delivery-proof-${Date.now()}.${fileExt}`;
      const filePath = `${logisticsLine.order_id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(filePath, proofFile);
      
      if (uploadError) {
        return json({ error: 'Failed to upload proof file' }, 500);
      }
      
      // Get signed URL
      const { data: signedData } = await supabase.storage
        .from('delivery-proofs')
        .createSignedUrl(uploadData.path, 7 * 24 * 60 * 60); // 7 days
      
      if (!signedData?.signedUrl) {
        return json({ error: 'Failed to generate signed URL' }, 500);
      }
      
      // Update logistics line
      const { data: updatedLine, error: updateError } = await supabase
        .from('logistics_lines')
        .update({
          proof_url: signedData.signedUrl,
          delivery_status: status || 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: user.id
        })
        .eq('id', lineId)
        .select()
        .single();
      
      if (updateError) {
        return json({ error: updateError.message }, 400);
      }
      
      return json(updatedLine);
    } catch (error) {
      console.error('Logistics update error:', error);
      return json({ error: 'Failed to update logistics line' }, 500);
    }
  }
  
  return null;
}

// Main request handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const { pathname, searchParams } = url;

  try {
    // API Documentation
    if (req.method === "GET" && pathname === "/api/docs") {
      const htmlBody = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Store API Documentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: '/api/docs.json', dom_id: '#swagger-ui', presets: [SwaggerUIBundle.presets.apis] });
    </script>
  </body>
</html>`;
      return html(htmlBody);
    }
    
    if (req.method === "GET" && pathname === "/api/docs.json") {
      const spec = {
        openapi: "3.0.3",
        info: { title: "Store Management API", version: "2.0.0" },
        servers: [{ url: "/api" }],
        paths: {
          "/store/healthz": { get: { summary: "Health check" } },
          "/store/auth/login": { post: { summary: "User login" } },
          "/store/auth/logout": { post: { summary: "User logout" } },
          "/store/sales-orders": { 
            get: { summary: "List sales orders" },
            post: { summary: "Create sales order" }
          },
          "/store/customers": { get: { summary: "List customers" } },
          "/store/inventory": { get: { summary: "View inventory" } },
          "/store/purchase-requests": { 
            get: { summary: "List purchase requests" },
            post: { summary: "Create purchase request" }
          }
        }
      };
      return json(spec);
    }

    // Health check
    if (req.method === "GET" && pathname === "/api/store/healthz") {
      return json({ ok: true, timestamp: new Date().toISOString() });
    }

    // Handle authentication routes (no auth required)
    const authResponse = await handleAuth(req, pathname);
    if (authResponse) return authResponse;

    // All other routes require authentication
    const userContext = await getUserContext(req);
    if (!userContext && pathname.startsWith("/api/store/")) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Route handlers
    const salesOrdersResponse = await handleSalesOrders(req, pathname, searchParams);
    if (salesOrdersResponse) return salesOrdersResponse;

    const customersResponse = await handleCustomers(req, pathname, searchParams);
    if (customersResponse) return customersResponse;

    const inventoryResponse = await handleInventory(req, pathname, searchParams);
    if (inventoryResponse) return inventoryResponse;

    const purchaseRequestsResponse = await handlePurchaseRequests(req, pathname, searchParams);
    if (purchaseRequestsResponse) return purchaseRequestsResponse;

    const transfersResponse = await handleTransfers(req, pathname, searchParams);
    if (transfersResponse) return transfersResponse;

    const returnsResponse = await handleReturns(req, pathname, searchParams);
    if (returnsResponse) return returnsResponse;

    const dashboardResponse = await handleDashboard(req, pathname, searchParams);
    if (dashboardResponse) return dashboardResponse;

    const pivotResponse = await handlePivot(req, pathname, searchParams);
    if (pivotResponse) return pivotResponse;

    const historyResponse = await handleHistory(req, pathname, searchParams);
    if (historyResponse) return historyResponse;

    const scrapResponse = await handleScrap(req, pathname, searchParams);
    if (scrapResponse) return scrapResponse;

    const repairsResponse = await handleRepairs(req, pathname, searchParams);
    if (repairsResponse) return repairsResponse;

    const logisticsResponse = await handleLogistics(req, pathname, searchParams);
    if (logisticsResponse) return logisticsResponse;

    // Not found
    return json({ error: "Endpoint not found", path: pathname }, 404);
    
  } catch (e) {
    console.error("API Error:", e);
    return json({ error: "Internal server error", message: String(e?.message || e) }, 500);
  }
});