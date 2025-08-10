import { Hono } from "https://deno.land/x/hono@v4.0.10/mod.ts";
import { cors } from "https://deno.land/x/hono@v4.0.10/middleware.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  AuthService, 
  SalesOrdersService, 
  CustomersService 
} from "../../../packages/core/src/index.ts";
import {
  loginSchema,
  salesOrderCreateSchema,
  customerCreateSchema,
  HealthCheck,
  ErrorCodes,
  ApiError,
  createValidationError,
  createUnauthorizedError,
  createInternalError
} from "../../../packages/shared/src/index.ts";

const app = new Hono();

// CORS middleware
app.use("*", cors({
  origin: "*",
  allowHeaders: ["authorization", "x-client-info", "apikey", "content-type"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Inject Supabase client for the services
globalThis.createClient = createClient;
globalThis.SupabaseClient = Object;

// Initialize services
const getAuthToken = (c: any) => c.req.header("Authorization") || "";

const authService = new AuthService(SUPABASE_URL, SUPABASE_ANON_KEY);

// Middleware to get user context
async function getUserContext(c: any) {
  const authToken = getAuthToken(c);
  if (!authToken) {
    throw createUnauthorizedError();
  }
  
  const userContext = await authService.getUserContext(authToken);
  if (!userContext) {
    throw createUnauthorizedError();
  }
  
  return userContext;
}

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  
  if (err instanceof ApiError) {
    return c.json({ 
      error: err.message, 
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString()
    }, err.statusCode);
  }
  
  return c.json({ 
    error: "Internal server error",
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString()
  }, 500);
});

// Health check endpoint
app.get("/api/store/healthz", async (c) => {
  const healthCheck: HealthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: "up",
      auth: "up",
    },
  };
  
  return c.json(healthCheck);
});

// Auth routes
app.post("/api/store/auth/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  
  if (!parsed.success) {
    throw createValidationError(parsed.error.flatten());
  }
  
  const result = await authService.login(parsed.data);
  return c.json(result);
});

app.post("/api/store/auth/logout", async (c) => {
  const userContext = await getUserContext(c);
  await authService.logout();
  return c.json({ success: true });
});

// Sales Orders routes
app.get("/api/store/sales-orders", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const salesOrdersService = new SalesOrdersService(SUPABASE_URL, SUPABASE_ANON_KEY, authToken);
  
  const page = Number(c.req.query("page") ?? "1");
  const limit = Number(c.req.query("limit") ?? "20");
  const status = c.req.query("status") ?? undefined;
  
  const canSeeCosts = authService.canSeeCostData(userContext.role);
  const result = await salesOrdersService.getSalesOrders(
    userContext,
    { page, limit, status },
    canSeeCosts
  );
  
  c.header("X-Total-Count", result.pagination.total.toString());
  return c.json(result.orders);
});

app.get("/api/store/sales-orders/:id", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const salesOrdersService = new SalesOrdersService(SUPABASE_URL, SUPABASE_ANON_KEY, authToken);
  
  const orderId = c.req.param("id");
  const canSeeCosts = authService.canSeeCostData(userContext.role);
  
  const result = await salesOrdersService.getSalesOrder(orderId, userContext, canSeeCosts);
  return c.json(result);
});

app.post("/api/store/sales-orders", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const salesOrdersService = new SalesOrdersService(SUPABASE_URL, SUPABASE_ANON_KEY, authToken);
  
  const body = await c.req.json();
  const parsed = salesOrderCreateSchema.safeParse(body);
  
  if (!parsed.success) {
    throw createValidationError(parsed.error.flatten());
  }
  
  const result = await salesOrdersService.createSalesOrder(parsed.data, userContext);
  return c.json(result, 201);
});

// Customers routes
app.get("/api/store/customers", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const customersService = new CustomersService(SUPABASE_URL, SUPABASE_ANON_KEY, authToken);
  
  const page = Number(c.req.query("page") ?? "1");
  const limit = Number(c.req.query("limit") ?? "20");
  const search = c.req.query("search") ?? undefined;
  
  const result = await customersService.getCustomers(
    userContext,
    { page, limit, search }
  );
  
  c.header("X-Total-Count", result.pagination.total.toString());
  return c.json(result.customers);
});

app.get("/api/store/customers/:id", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const customersService = new CustomersService(SUPABASE_URL, SUPABASE_ANON_KEY, authToken);
  
  const customerId = c.req.param("id");
  const result = await customersService.getCustomer(customerId, userContext);
  return c.json(result);
});

app.get("/api/store/customers/:id/interactions", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const customersService = new CustomersService(SUPABASE_URL, SUPABASE_ANON_KEY, authToken);
  
  const customerId = c.req.param("id");
  const result = await customersService.getCustomerInteractions(customerId, userContext);
  return c.json(result);
});

app.post("/api/store/customers", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const customersService = new CustomersService(SUPABASE_URL, SUPABASE_ANON_KEY, authToken);
  
  const body = await c.req.json();
  const parsed = customerCreateSchema.safeParse(body);
  
  if (!parsed.success) {
    throw createValidationError(parsed.error.flatten());
  }
  
  const result = await customersService.createCustomer(parsed.data, userContext);
  return c.json(result, 201);
});

// Dashboard endpoint
app.get("/api/store/dashboard", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  // Today's sales metrics
  const today = new Date().toISOString().split('T')[0];
  const { data: todaySales } = await supabase
    .from('vw_sales_summary')
    .select('order_count, total_sales')
    .eq('store_id', userContext.storeId)
    .eq('order_date', today)
    .single();

  // Inventory warnings (low stock)
  const { data: lowStock } = await supabase
    .from('vw_inventory')
    .select('id, sku, product_name, quantity, reorder_point')
    .eq('store_id', userContext.storeId)
    .filter('quantity', 'lt', 'reorder_point')
    .limit(10);

  // Pending tasks
  const [transfersResult, returnsResult, scrapResult] = await Promise.all([
    // Pending transfer receipts
    supabase
      .from('TransferOrder')
      .select('id')
      .eq('toStoreId', userContext.storeId)
      .eq('status', 'SHIPPED'),
    // Pending return restocks
    supabase
      .from('ReturnLine')
      .select('id')
      .eq('restockStatus', 'PENDING'),
    // Pending scrap approvals
    supabase
      .from('scrap_headers')
      .select('id')
      .eq('store_id', userContext.storeId)
      .eq('status', 'pending')
  ]);

  const dashboard = {
    todayMetrics: {
      salesAmount: todaySales?.total_sales || 0,
      orderCount: todaySales?.order_count || 0
    },
    inventoryWarnings: {
      lowStockCount: lowStock?.length || 0,
      items: lowStock || []
    },
    pendingTasks: {
      transferReceipts: transfersResult.data?.length || 0,
      returnRestocks: returnsResult.data?.length || 0,
      scrapApprovals: scrapResult.data?.length || 0
    }
  };

  return c.json(dashboard);
});

// Sales orders pivot endpoint
app.get("/api/store/sales-orders/pivot", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const source = c.req.query("source");
  const fromDate = c.req.query("fromDate");
  const toDate = c.req.query("toDate");
  const groupBy = c.req.query("groupBy") || "sales_date"; // sales_date, customer_source, store_id

  let query = supabase
    .from('vw_sales_summary')
    .select('*')
    .eq('store_id', userContext.storeId)
    .order('sales_date', { ascending: false });

  if (source) {
    query = query.eq('customer_source', source);
  }

  if (fromDate) {
    query = query.gte('sales_date', fromDate);
  }

  if (toDate) {
    query = query.lte('sales_date', toDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filter cost data based on user role
  const canSeeCosts = authService.canSeeCostData(userContext.role);
  const filteredData = data?.map(row => {
    if (!canSeeCosts) {
      const { total_gross_profit, ...rest } = row;
      return rest;
    }
    return row;
  });

  // Group and aggregate data based on groupBy parameter
  const aggregated = filteredData?.reduce((acc: any, row: any) => {
    const key = row[groupBy] || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        groupKey: key,
        orderCount: 0,
        totalSales: 0,
        totalDiscount: 0,
        totalTax: 0,
        avgOrderValue: 0,
        extendedWarrantyCount: 0,
        totalWarrantyAmount: 0,
        totalGrossProfit: canSeeCosts ? 0 : undefined
      };
    }
    
    acc[key].orderCount += row.order_count || 0;
    acc[key].totalSales += row.total_sales || 0;
    acc[key].totalDiscount += row.total_discount || 0;
    acc[key].totalTax += row.total_tax || 0;
    acc[key].extendedWarrantyCount += row.extended_warranty_count || 0;
    acc[key].totalWarrantyAmount += row.total_warranty_amount || 0;
    
    if (canSeeCosts) {
      acc[key].totalGrossProfit += row.total_gross_profit || 0;
    }
    
    return acc;
  }, {});

  // Calculate averages
  Object.values(aggregated || {}).forEach((group: any) => {
    if (group.orderCount > 0) {
      group.avgOrderValue = group.totalSales / group.orderCount;
    }
  });

  return c.json({
    data: Object.values(aggregated || {}),
    filters: { source, fromDate, toDate, groupBy },
    summary: {
      totalOrders: filteredData?.reduce((sum, row) => sum + (row.order_count || 0), 0) || 0,
      totalSales: filteredData?.reduce((sum, row) => sum + (row.total_sales || 0), 0) || 0,
      totalGrossProfit: canSeeCosts ? 
        filteredData?.reduce((sum, row) => sum + (row.total_gross_profit || 0), 0) || 0 
        : undefined
    }
  });
});

// Sales orders history endpoint  
app.get("/api/store/sales-orders/history", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const orderId = c.req.query("orderId");
  const fromDate = c.req.query("fromDate");
  const toDate = c.req.query("toDate");

  // Get audit logs from notifications (where we store audit events)
  let auditQuery = supabase
    .from('notifications')
    .select('*')
    .eq('type', 'audit_log')
    .order('created_at', { ascending: false });

  if (userContext.storeId) {
    auditQuery = auditQuery.eq('user_id', userContext.userId);
  }

  if (fromDate) {
    auditQuery = auditQuery.gte('created_at', fromDate);
  }

  if (toDate) {
    auditQuery = auditQuery.lte('created_at', toDate);
  }

  const { data: auditLogs } = await auditQuery.limit(100);

  // Get item events if orderId specified
  let itemEvents: any[] = [];
  if (orderId) {
    const { data: events } = await supabase
      .from('ItemEvent')
      .select('*')
      .eq('docId', orderId)
      .eq('docType', 'SALES_ORDER')
      .order('createdAt', { ascending: false });
    
    itemEvents = events || [];
  }

  // Combine and format history
  const history = [
    ...(auditLogs?.map(log => ({
      id: log.id,
      type: 'audit',
      action: log.metadata?.audit_event?.action || 'unknown',
      entityType: log.metadata?.audit_event?.entity_type || 'unknown',
      entityId: log.metadata?.audit_event?.entity_id,
      actorName: log.metadata?.audit_event?.actor_name,
      timestamp: log.created_at,
      details: log.message,
      metadata: log.metadata?.audit_event?.metadata
    })) || []),
    ...itemEvents.map(event => ({
      id: event.id,
      type: 'item_event',
      action: event.type,
      entityType: 'item',
      entityId: event.itemId,
      actorName: event.createdById,
      timestamp: event.createdAt,
      details: `Item ${event.type} for document ${event.docNo}`,
      metadata: event.payload
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return c.json({
    history,
    filters: { orderId, fromDate, toDate },
    total: history.length
  });
});

// OpenAPI documentation
app.get("/api/docs", (c) => {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Store API",
      version: "1.0.0",
      description: "Comprehensive Store Management API"
    },
    servers: [
      {
        url: "/api",
        description: "Store API Server"
      }
    ],
    paths: {
      "/store/healthz": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Service health status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["ok"] },
                      timestamp: { type: "string" },
                      version: { type: "string" },
                      services: {
                        type: "object",
                        properties: {
                          database: { type: "string", enum: ["up", "down"] },
                          auth: { type: "string", enum: ["up", "down"] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/store/auth/login": {
        post: {
          summary: "User login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 }
                  },
                  required: ["email", "password"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Login successful" },
            "401": { description: "Invalid credentials" }
          }
        }
      },
      "/store/sales-orders": {
        get: {
          summary: "Get sales orders",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "status", in: "query", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "List of sales orders" }
          }
        },
        post: {
          summary: "Create sales order",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orderDate: { type: "string" },
                    status: { type: "string" },
                    totalAmount: { type: "number" },
                    lines: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          productId: { type: "string" },
                          quantity: { type: "integer" },
                          unitPrice: { type: "number" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Sales order created" }
          }
        }
      },
      "/store/customers": {
        get: {
          summary: "Get customers",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "search", in: "query", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "List of customers" }
          }
        }
      },
      "/store/dashboard": {
        get: {
          summary: "Get dashboard data",
          responses: {
            "200": {
              description: "Dashboard metrics",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      todayMetrics: {
                        type: "object",
                        properties: {
                          salesAmount: { type: "number" },
                          orderCount: { type: "integer" }
                        }
                      },
                      inventoryWarnings: {
                        type: "object",
                        properties: {
                          lowStockCount: { type: "integer" },
                          items: { type: "array" }
                        }
                      },
                      pendingTasks: {
                        type: "object",
                        properties: {
                          transferReceipts: { type: "integer" },
                          returnRestocks: { type: "integer" },
                          scrapApprovals: { type: "integer" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/store/sales-orders/pivot": {
        get: {
          summary: "Get sales pivot data",
          parameters: [
            { name: "source", in: "query", schema: { type: "string" } },
            { name: "fromDate", in: "query", schema: { type: "string" } },
            { name: "toDate", in: "query", schema: { type: "string" } },
            { name: "groupBy", in: "query", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Pivot analysis data" }
          }
        }
      },
      "/store/sales-orders/history": {
        get: {
          summary: "Get sales order history",
          parameters: [
            { name: "orderId", in: "query", schema: { type: "string" } },
            { name: "fromDate", in: "query", schema: { type: "string" } },
            { name: "toDate", in: "query", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Order history and audit trail" }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  };
  
  return c.json(openApiSpec);
});

// OpenAPI UI
app.get("/api/docs/ui", (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Store API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.standalone
            ]
          });
        </script>
      </body>
    </html>
  `;
  
  return c.html(html);
});

serve(app.fetch);