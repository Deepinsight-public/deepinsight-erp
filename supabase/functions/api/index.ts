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

async function handleReturns(req: Request, pathname: string, searchParams: URLSearchParams) {
  const supabase = getSupabaseClient(req);
  const userContext = await getUserContext(req);
  if (!userContext) return json({ error: "Unauthorized" }, 401);
  
  const { profile } = userContext;
  
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

    const returnsResponse = await handleReturns(req, pathname, searchParams);
    if (returnsResponse) return returnsResponse;

    // Not found
    return json({ error: "Endpoint not found", path: pathname }, 404);
    
  } catch (e) {
    console.error("API Error:", e);
    return json({ error: "Internal server error", message: String(e?.message || e) }, 500);
  }
});