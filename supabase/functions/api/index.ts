import { Hono } from "https://deno.land/x/hono@v3.12.12/mod.ts";
import { cors } from "https://deno.land/x/hono@v3.12.12/middleware/cors/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient(req: Request) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment not configured");
  }
  const authHeader = req.headers.get("Authorization") || "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

const app = new Hono();

// Global CORS
app.use("*", cors());

// Health check
app.get("/api/store/healthz", (c) => {
  return c.json({ ok: true }, 200, corsHeaders);
});

// Swagger UI and OpenAPI JSON
app.get("/api/docs", (c) => {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Store API Docs</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
    <style>body { margin:0; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/docs.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout'
      });
    </script>
  </body>
</html>`;
  return c.html(html, 200, corsHeaders);
});

app.get("/api/docs.json", (c) => {
  const spec = {
    openapi: "3.0.3",
    info: { title: "Store API Compatibility Layer", version: "1.0.0" },
    servers: [{ url: "/api" }],
    paths: {
      "/store/healthz": {
        get: {
          summary: "Health check",
          responses: { "200": { description: "OK" } },
        },
      },
      "/store/customers": {
        get: {
          summary: "List customers",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Array of customers",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Customer" } },
                },
              },
            },
          },
        },
      },
      "/store/sales-orders": {
        get: {
          summary: "List sales orders",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Array of sales orders",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/SalesOrder" } },
                },
              },
            },
          },
        },
        post: {
          summary: "Create sales order",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SalesOrderCreate" } },
            },
          },
          responses: {
            "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          },
        },
      },
    },
    components: {
      schemas: {
        Customer: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            customer_code: { type: "string", nullable: true },
            name: { type: "string" },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            company: { type: "string", nullable: true },
            notes: { type: "string", nullable: true },
            tags: { type: "array", items: { type: "string" }, nullable: true },
            status: { type: "string" },
            store_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            created_by: { type: "string", format: "uuid", nullable: true },
            import_batch_id: { type: "string", format: "uuid", nullable: true },
          },
          required: ["id", "name", "store_id", "created_at", "updated_at", "status"],
        },
        SalesOrderLine: {
          type: "object",
          properties: {
            productId: { type: "string", format: "uuid" },
            sku: { type: "string" },
            productName: { type: "string" },
            quantity: { type: "integer" },
            unitPrice: { type: "number" },
            discountPercent: { type: "number" },
            subTotal: { type: "number" },
          },
          required: ["productId", "sku", "quantity", "unitPrice", "subTotal"],
        },
        SalesOrder: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderNumber: { type: "string" },
            customerId: { type: "string", format: "uuid" },
            customerName: { type: "string" },
            customerEmail: { type: "string" },
            customerPhone: { type: "string" },
            orderDate: { type: "string" },
            orderType: { type: "string" },
            status: { type: "string" },
            subTotal: { type: "number" },
            discountAmount: { type: "number" },
            taxAmount: { type: "number" },
            totalAmount: { type: "number" },
            lines: { type: "array", items: { $ref: "#/components/schemas/SalesOrderLine" } },
          },
          required: ["id", "orderDate", "status", "totalAmount"],
        },
        SalesOrderCreate: {
          type: "object",
          properties: {
            orderDate: { type: "string" },
            orderType: { type: "string" },
            status: { type: "string" },
            subTotal: { type: "number" },
            discountAmount: { type: "number" },
            taxAmount: { type: "number" },
            totalAmount: { type: "number" },
            lines: { type: "array", items: { $ref: "#/components/schemas/SalesOrderLine" } },
            customerName: { type: "string" },
            customerEmail: { type: "string" },
            customerPhone: { type: "string" },
            customerFirst: { type: "string" },
            customerLast: { type: "string" },
            addrCountry: { type: "string" },
            addrState: { type: "string" },
            addrCity: { type: "string" },
            addrStreet: { type: "string" },
            addrZipcode: { type: "string" },
            warrantyYears: { type: "integer" },
            warrantyAmount: { type: "number" },
            walkInDelivery: { type: "string" },
            accessory: { type: "string" },
            otherServices: { type: "string" },
            otherFee: { type: "number" },
            paymentMethod: { type: "string" },
            paymentNote: { type: "string" },
            customerSource: { type: "string" },
            cashierId: { type: "string" },
          },
          required: ["orderDate", "status", "subTotal", "discountAmount", "taxAmount", "totalAmount", "lines"],
        },
      },
    },
  } as const;
  return c.json(spec, 200, { ...corsHeaders, "Content-Type": "application/json" });
});

// Auth guard (require Authorization header)
function requireAuth(c: any) {
  const auth = c.req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401, corsHeaders);
  }
}

// GET /customers
app.get("/api/store/customers", async (c) => {
  const unauthorized = requireAuth(c);
  if (unauthorized) return unauthorized;

  const page = Number(c.req.query("page") ?? "1");
  const limit = Number(c.req.query("limit") ?? "20");
  const search = c.req.query("search") ?? "";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabaseClient(c.req.raw);
  let query = supabase.from("customers").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,customer_code.ilike.%${search}%`,
    );
  }
  const { data, error, count } = await query.range(from, to);
  if (error) return c.json({ error: error.message }, 500, corsHeaders);

  // Return array for compatibility, with total via header
  c.header("X-Total-Count", String(count ?? 0));
  return c.json(data ?? [], 200, corsHeaders);
});

// Schemas for POST /sales-orders
const lineSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  productName: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  subTotal: z.number().nonnegative(),
});

const orderSchema = z.object({
  orderDate: z.string(),
  orderType: z.enum(["retail", "wholesale"]).optional().default("retail"),
  status: z.enum(["draft", "submitted", "pending", "confirmed", "shipped", "completed", "cancelled"]),
  subTotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  lines: z.array(lineSchema).min(1),
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

// GET /sales-orders
app.get("/api/store/sales-orders", async (c) => {
  const unauthorized = requireAuth(c);
  if (unauthorized) return unauthorized;

  const page = Number(c.req.query("page") ?? "1");
  const limit = Number(c.req.query("limit") ?? "20");
  const status = c.req.query("status") ?? "";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabaseClient(c.req.raw);
  let query = supabase.from("sales_orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(from, to);
  if (error) return c.json({ error: error.message }, 500, corsHeaders);

  c.header("X-Total-Count", String(count ?? 0));
  return c.json(data ?? [], 200, corsHeaders);
});

// POST /sales-orders
app.post("/api/store/sales-orders", async (c) => {
  const unauthorized = requireAuth(c);
  if (unauthorized) return unauthorized;

  const payload = await c.req.json().catch(() => null);
  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400, corsHeaders);
  }
  const input = parsed.data;

  const supabase = getSupabaseClient(c.req.raw);
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return c.json({ error: "Unauthorized" }, 401, corsHeaders);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("store_id, role")
    .eq("user_id", user.id)
    .single();
  if (profileError || !profile?.store_id) {
    return c.json({ error: "Profile not found or store unassigned" }, 403, corsHeaders);
  }

  // If status is submitted, prefer the RPC that also deducts stock
  if (input.status === "submitted") {
    const order_data = {
      order_number: null,
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
      warranty_years: input.warrantyYears ?? null,
      warranty_amount: input.warrantyAmount ?? null,
      walk_in_delivery: input.walkInDelivery ?? null,
      accessory: input.accessory ?? null,
      other_services: input.otherServices ?? null,
      other_fee: input.otherFee ?? null,
      payment_method: input.paymentMethod ?? null,
      payment_note: input.paymentNote ?? null,
      customer_source: input.customerSource ?? null,
      cashier_id: input.cashierId ?? null,
      store_id: profile.store_id,
      created_by: user.id,
    } as const;

    const line_items = input.lines.map((l) => {
      const lineTotal = l.subTotal;
      const full = l.unitPrice * l.quantity;
      const discount_amount = Math.max(0, full - lineTotal);
      return {
        product_id: l.productId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        discount_amount,
        total_amount: lineTotal,
        sku: l.sku,
      } as const;
    });

    const { data, error } = await supabase.rpc("create_sales_order_with_stock_deduction", {
      order_data,
      line_items,
    });
    if (error) return c.json({ error: error.message }, 400, corsHeaders);
    // RPC returns a single row
    return c.json(data?.[0] ?? data, 201, corsHeaders);
  }

  // Otherwise, do simple insert
  const orderInsert = {
    order_number: null,
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
    warranty_years: input.warrantyYears ?? null,
    warranty_amount: input.warrantyAmount ?? null,
    walk_in_delivery: input.walkInDelivery ?? null,
    accessory: input.accessory ?? null,
    other_services: input.otherServices ?? null,
    other_fee: input.otherFee ?? null,
    payment_method: input.paymentMethod ?? null,
    payment_note: input.paymentNote ?? null,
    customer_source: input.customerSource ?? null,
    cashier_id: input.cashierId ?? null,
    store_id: profile.store_id,
    created_by: user.id,
  } as const;

  const { data: order, error: insertErr } = await supabase.from("sales_orders").insert(orderInsert).select("*").single();
  if (insertErr) return c.json({ error: insertErr.message }, 400, corsHeaders);

  const items = input.lines.map((l) => {
    const lineTotal = l.subTotal;
    const full = l.unitPrice * l.quantity;
    const discount_amount = Math.max(0, full - lineTotal);
    return {
      sales_order_id: order.id,
      product_id: l.productId,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      discount_amount,
      total_amount: lineTotal,
    };
  });
  const { error: itemErr } = await supabase.from("sales_order_items").insert(items);
  if (itemErr) return c.json({ error: itemErr.message }, 400, corsHeaders);

  return c.json(order, 201, corsHeaders);
});

// Default handler
Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return app.fetch(req);
});
