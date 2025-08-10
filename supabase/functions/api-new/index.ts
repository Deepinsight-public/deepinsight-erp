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