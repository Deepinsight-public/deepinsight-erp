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
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Storage utilities
const getSupabaseAdmin = () => createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadToStorage(bucket: string, path: string, file: File | Uint8Array, contentType?: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || 'application/octet-stream',
      upsert: true
    });

  if (error) throw error;
  return data;
}

async function getSignedUrl(bucket: string, path: string, expiresIn: number = 604800) { // 7 days default
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

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

// Scrap endpoints
app.post("/api/store/scrap", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const body = await c.req.json();
  const { items, photoFiles, ...headerData } = body;

  // Upload photos if provided
  let photoUrls: string[] = [];
  if (photoFiles && photoFiles.length > 0) {
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const fileName = `${userContext.storeId}/${Date.now()}_${i}.jpg`;
      
      // Convert base64 to Uint8Array if needed
      const fileData = typeof file === 'string' 
        ? new Uint8Array(atob(file).split('').map(c => c.charCodeAt(0)))
        : file;
      
      await uploadToStorage('scrap-photos', fileName, fileData, 'image/jpeg');
      const signedUrl = await getSignedUrl('scrap-photos', fileName);
      photoUrls.push(signedUrl);
    }
  }

  // Create scrap header
  const { data: scrapHeader, error } = await supabase
    .from('scrap_headers')
    .insert({
      store_id: userContext.storeId,
      warehouse_id: headerData.warehouseId,
      scrap_no: `SCR-${Date.now()}`,
      created_by: userContext.userId,
      photo_urls: photoUrls,
      status: 'draft'
    })
    .select()
    .single();

  if (error) throw error;

  // Create scrap lines
  if (items && items.length > 0) {
    const scrapLines = items.map((item: any) => ({
      header_id: scrapHeader.id,
      product_id: item.productId,
      qty: item.quantity,
      unit_cost: item.unitCost,
      reason: item.reason,
      batch_no: item.batchNo
    }));

    const { error: linesError } = await supabase
      .from('scrap_lines')
      .insert(scrapLines);

    if (linesError) throw linesError;
  }

  return c.json(scrapHeader, 201);
});

// Logistics endpoints
app.put("/api/store/logistics/lines/:id", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const lineId = c.req.param("id");
  const body = await c.req.json();
  const { proofFile, ...updateData } = body;

  let proofUrl: string | null = null;

  // Upload proof file if provided
  if (proofFile) {
    const fileName = `${userContext.storeId}/${lineId}_${Date.now()}.jpg`;
    
    // Convert base64 to Uint8Array if needed
    const fileData = typeof proofFile === 'string' 
      ? new Uint8Array(atob(proofFile).split('').map(c => c.charCodeAt(0)))
      : proofFile;
    
    await uploadToStorage('delivery-proofs', fileName, fileData, 'image/jpeg');
    proofUrl = await getSignedUrl('delivery-proofs', fileName);
  }

  // Update logistics line
  const { data, error } = await supabase
    .from('logistics_lines')
    .update({
      ...updateData,
      proof_url: proofUrl || updateData.proofUrl,
      delivered_by: userContext.userId,
      delivered_at: new Date().toISOString()
    })
    .eq('id', lineId)
    .select()
    .single();

  if (error) throw error;

  return c.json(data);
});

// Repairs endpoints
app.post("/api/store/repairs", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const body = await c.req.json();
  const { documentFile, ...repairData } = body;

  let documentUrl: string | null = null;

  // Upload document if provided
  if (documentFile) {
    const fileName = `${userContext.storeId}/${Date.now()}_repair_doc.pdf`;
    
    // Convert base64 to Uint8Array if needed
    const fileData = typeof documentFile === 'string' 
      ? new Uint8Array(atob(documentFile).split('').map(c => c.charCodeAt(0)))
      : documentFile;
    
    await uploadToStorage('repair-docs', fileName, fileData, 'application/pdf');
    documentUrl = await getSignedUrl('repair-docs', fileName);
  }

  // Get disclaimer from system settings
  const { data: systemSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'repair_disclaimer')
    .single();

  const disclaimer = systemSetting?.value || "Standard repair disclaimer text";

  // Generate repair ID
  const repairId = `${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  // Create repair record
  const { data, error } = await supabase
    .from('repairs')
    .insert({
      repair_id: repairId,
      store_id: userContext.storeId,
      product_id: repairData.productId,
      customer_id: repairData.customerId,
      customer_name: repairData.customerName,
      sales_order_id: repairData.salesOrderId,
      type: repairData.type,
      description: repairData.description,
      warranty_status: repairData.warrantyStatus,
      warranty_expires_at: repairData.warrantyExpiresAt,
      estimated_completion: repairData.estimatedCompletion,
      cost: repairData.cost,
      document_url: documentUrl,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  return c.json({ ...data, disclaimer }, 201);
});

// Transfer endpoints
app.post("/api/store/inventory/transfer-out", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const body = await c.req.json();
  const { kind, toStoreId, fromStoreId, reason, items } = body;

  // Determine transfer kind based on store IDs
  const transferKind = kind || (toStoreId === userContext.storeId ? 'HQ_TO_STORE' : 
                               fromStoreId === userContext.storeId ? 'STORE_TO_HQ' : 
                               'STORE_TO_STORE');

  // Create transfer order
  const docNo = `TXN-${Date.now()}`;
  const { data: transfer, error } = await supabase
    .from('TransferOrder')
    .insert({
      docNo,
      kind: transferKind,
      fromStoreId: fromStoreId || userContext.storeId,
      toStoreId,
      reason,
      status: 'DRAFT',
      createdById: userContext.userId
    })
    .select()
    .single();

  if (error) throw error;

  // Create transfer lines
  if (items && items.length > 0) {
    const transferLines = items.map((item: any) => ({
      orderId: transfer.id,
      itemId: item.itemId
    }));

    const { error: linesError } = await supabase
      .from('TransferLine')
      .insert(transferLines);

    if (linesError) throw linesError;
  }

  return c.json({ ...transfer, lines: items }, 201);
});

app.get("/api/store/inventory/transfer-out", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const { data, error } = await supabase
    .from('TransferOrder')
    .select('*')
    .eq('fromStoreId', userContext.storeId)
    .order('createdAt', { ascending: false });

  if (error) throw error;

  return c.json(data);
});

app.get("/api/store/inventory/transfer-in", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const { data, error } = await supabase
    .from('TransferOrder')
    .select('*')
    .eq('toStoreId', userContext.storeId)
    .order('createdAt', { ascending: false });

  if (error) throw error;

  return c.json(data);
});

app.put("/api/store/transfers/:id/ship", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const transferId = c.req.param("id");
  const body = await c.req.json();

  // Update transfer status to SHIPPED
  const { error } = await supabase
    .from('TransferOrder')
    .update({ status: 'SHIPPED' })
    .eq('id', transferId);

  if (error) throw error;

  // Update item statuses to in_transit
  const { data: transferLines } = await supabase
    .from('TransferLine')
    .select('itemId')
    .eq('orderId', transferId);

  if (transferLines) {
    for (const line of transferLines) {
      await supabase
        .from('Item')
        .update({ status: 'in_transit' })
        .eq('id', line.itemId);

      // Create ScanLog entry
      await supabase
        .from('ScanLog')
        .insert({
          itemId: line.itemId,
          epc: `EPC-${line.itemId}`,
          action: 'TRANSFER_SHIPPED',
          docType: 'TRANSFER',
          docId: transferId,
          storeId: userContext.storeId,
          createdById: userContext.userId
        });
    }
  }

  return c.json({ success: true, message: 'Transfer shipped successfully' });
});

app.put("/api/store/transfers/:id/receive", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const transferId = c.req.param("id");
  const body = await c.req.json();
  const { items } = body;

  // Get transfer details
  const { data: transfer } = await supabase
    .from('TransferOrder')
    .select('*')
    .eq('id', transferId)
    .single();

  if (!transfer) throw createValidationError({ message: 'Transfer not found' });

  // Update transfer status to RECEIVED
  await supabase
    .from('TransferOrder')
    .update({ status: 'RECEIVED' })
    .eq('id', transferId);

  // Update items and create events
  if (items) {
    for (const item of items) {
      // Update item location and status
      await supabase
        .from('Item')
        .update({ 
          currentStoreId: transfer.toStoreId,
          status: 'in_stock'
        })
        .eq('id', item.itemId);

      // Create ItemEvent
      await supabase
        .from('ItemEvent')
        .insert({
          itemId: item.itemId,
          type: 'TRANSFER_RECEIVED',
          docType: 'TRANSFER',
          docId: transferId,
          docNo: transfer.docNo,
          storeId: transfer.toStoreId,
          payload: {
            condition: item.condition,
            receivedOn: new Date().toISOString()
          },
          createdById: userContext.userId
        });
    }
  }

  return c.json({ success: true, message: 'Transfer received successfully' });
});

// After-sales returns endpoints
app.post("/api/store/after-sales/returns", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const body = await c.req.json();
  const { originalOrderId, isCustomerReturn, refundMode, returnWHId, lines } = body;

  // Create return order
  const docNo = `RET-${Date.now()}`;
  const { data: returnOrder, error } = await supabase
    .from('ReturnOrder')
    .insert({
      docNo,
      originalOrderId,
      isCustomerReturn: isCustomerReturn || false,
      refundMode: refundMode || 'ADJUSTED_PRICE',
      returnWHId,
      storeId: userContext.storeId,
      status: 'DRAFT',
      createdById: userContext.userId
    })
    .select()
    .single();

  if (error) throw error;

  // Create return lines
  const returnLines = [];
  if (lines && lines.length > 0) {
    for (const line of lines) {
      const { data: returnLine, error: lineError } = await supabase
        .from('ReturnLine')
        .insert({
          orderId: returnOrder.id,
          originalLineId: line.originalLineId,
          itemId: line.itemId,
          productBarcode: line.productBarcode,
          reason: line.reason,
          restockStatus: 'PENDING'
        })
        .select()
        .single();

      if (lineError) throw lineError;
      returnLines.push(returnLine);
    }
  }

  return c.json({ ...returnOrder, lines: returnLines }, 201);
});

app.get("/api/store/after-sales/returns/:id", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const returnId = c.req.param("id");

  const { data: returnOrder, error } = await supabase
    .from('ReturnOrder')
    .select(`
      *,
      lines:ReturnLine(*)
    `)
    .eq('id', returnId)
    .single();

  if (error) throw error;

  return c.json(returnOrder);
});

app.put("/api/store/after-sales/returns/:id/receive", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const returnId = c.req.param("id");
  const body = await c.req.json();

  // Update all return lines to received status
  const { error } = await supabase
    .from('ReturnLine')
    .update({
      receivedById: userContext.userId,
      receivedOn: new Date().toISOString()
    })
    .eq('orderId', returnId);

  if (error) throw error;

  return c.json({ success: true, message: 'Return received successfully' });
});

app.put("/api/store/after-sales/returns/:id/restock-line/:lineId", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const returnId = c.req.param("id");
  const lineId = c.req.param("lineId");
  const body = await c.req.json();
  const { epc } = body;

  // Get return line details
  const { data: returnLine } = await supabase
    .from('ReturnLine')
    .select('*')
    .eq('id', lineId)
    .single();

  if (!returnLine) throw createValidationError({ message: 'Return line not found' });

  // Update return line to IN_STOCK
  await supabase
    .from('ReturnLine')
    .update({
      restockStatus: 'IN_STOCK',
      restockedById: userContext.userId,
      restockedOn: new Date().toISOString()
    })
    .eq('id', lineId);

  // Update item status
  await supabase
    .from('Item')
    .update({
      status: 'in_stock',
      currentStoreId: userContext.storeId
    })
    .eq('id', returnLine.itemId);

  // Create ScanLog
  await supabase
    .from('ScanLog')
    .insert({
      itemId: returnLine.itemId,
      epc: epc,
      action: 'RETURN_RESTOCK',
      docType: 'RETURN',
      docId: returnId,
      storeId: userContext.storeId,
      createdById: userContext.userId
    });

  return c.json({ success: true, message: 'Item restocked successfully' });
});

// Inventory item endpoints
app.get("/api/store/inventory/items/:id", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const itemId = c.req.param("id");

  const { data, error } = await supabase
    .from('Item')
    .select('*')
    .eq('id', itemId)
    .single();

  if (error) throw error;

  return c.json(data);
});

app.get("/api/store/inventory/items/:id/events", async (c) => {
  const userContext = await getUserContext(c);
  const authToken = getAuthToken(c);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authToken } }
  });

  const itemId = c.req.param("id");

  const { data, error } = await supabase
    .from('ItemEvent')
    .select('*')
    .eq('itemId', itemId)
    .order('createdAt', { ascending: false });

  if (error) throw error;

  return c.json(data);
});

// Storage utility endpoints
app.post("/api/store/storage/upload", async (c) => {
  const userContext = await getUserContext(c);
  const formData = await c.req.formData();
  
  const file = formData.get('file') as File;
  const bucket = formData.get('bucket') as string;
  const path = formData.get('path') as string;

  if (!file || !bucket || !path) {
    throw createValidationError({ message: 'Missing required fields: file, bucket, path' });
  }

  // Validate bucket access
  const allowedBuckets = ['scrap-photos', 'delivery-proofs', 'repair-docs'];
  if (!allowedBuckets.includes(bucket)) {
    throw createValidationError({ message: 'Invalid bucket name' });
  }

  const fileName = `${userContext.storeId}/${path}`;
  const uploadResult = await uploadToStorage(bucket, fileName, file);
  const signedUrl = await getSignedUrl(bucket, fileName);

  return c.json({
    path: uploadResult.path,
    signedUrl,
    expiresIn: 604800 // 7 days
  });
});

app.get("/api/store/storage/signed-url", async (c) => {
  const userContext = await getUserContext(c);
  const bucket = c.req.query("bucket");
  const path = c.req.query("path");

  if (!bucket || !path) {
    throw createValidationError({ message: 'Missing required query parameters: bucket, path' });
  }

  // Validate bucket access
  const allowedBuckets = ['scrap-photos', 'delivery-proofs', 'repair-docs'];
  if (!allowedBuckets.includes(bucket)) {
    throw createValidationError({ message: 'Invalid bucket name' });
  }

  const fullPath = `${userContext.storeId}/${path}`;
  const signedUrl = await getSignedUrl(bucket, fullPath);

  return c.json({
    signedUrl,
    expiresIn: 604800 // 7 days
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