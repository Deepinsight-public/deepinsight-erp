-- Migration 002: Create Replacement Views
-- This migration creates views that maintain API compatibility while using the new schema

DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 2: Creating replacement views for deprecated tables';
END $$;

-- ===== SALES ORDERS VIEWS =====

-- Legacy sales_orders view for API compatibility
CREATE OR REPLACE VIEW public.vw_sales_orders_list AS
SELECT 
    so.id,
    so.order_number,
    so.customer_name,
    so.customer_email,
    so.customer_phone,
    so.customer_first,
    so.customer_last,
    so.addr_country,
    so.addr_state,
    so.addr_city,
    so.addr_street,
    so.addr_zipcode,
    so.order_date,
    so.status,
    so.total_amount,
    so.discount_amount,
    so.tax_amount,
    so.warranty_years,
    so.warranty_amount,
    so.walk_in_delivery,
    so.accessory,
    so.other_services,
    so.other_fee,
    so.payment_method,
    so.payment_note,
    so.customer_source,
    so.cashier_id,
    so.store_id,
    so.created_by,
    so.created_at,
    so.updated_at,
    -- Calculated fields
    COALESCE(
        (SELECT COUNT(*) FROM sales_order_items soi WHERE soi.sales_order_id = so.id), 
        0
    ) as line_count,
    COALESCE(
        (SELECT SUM(soi.quantity) FROM sales_order_items soi WHERE soi.sales_order_id = so.id),
        0
    ) as total_quantity,
    -- Extended warranty flag
    CASE WHEN so.warranty_years > 1 THEN true ELSE false END as has_extended_warranty
FROM 
    (SELECT * FROM public.sales_orders_deprecated 
     UNION ALL 
     SELECT 
         id, order_number, customer_name, customer_email, customer_phone,
         customer_first, customer_last, addr_country, addr_state, addr_city,
         addr_street, addr_zipcode, order_date, status, total_amount,
         discount_amount, tax_amount, warranty_years, warranty_amount,
         walk_in_delivery, accessory, other_services, other_fee,
         payment_method, payment_note, customer_source, cashier_id,
         store_id, created_by, created_at, updated_at
     FROM public.sales_orders 
     WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders' AND table_schema = 'public')
    ) so;

COMMENT ON VIEW public.vw_sales_orders_list IS 'Legacy sales_orders API compatibility view. Combines deprecated table data with current schema.';

-- Sales summary view with source filtering support
CREATE OR REPLACE VIEW public.vw_sales_summary AS
SELECT 
    DATE_TRUNC('day', so.order_date) as order_date,
    so.store_id,
    s.store_name,
    so.customer_source,
    COUNT(*) as order_count,
    SUM(so.total_amount) as total_revenue,
    SUM(so.discount_amount) as total_discounts,
    SUM(so.tax_amount) as total_tax,
    SUM(so.warranty_amount) as total_warranty_revenue,
    AVG(so.total_amount) as avg_order_value,
    SUM(CASE WHEN so.warranty_years > 1 THEN 1 ELSE 0 END) as extended_warranty_count,
    -- Line item summary
    SUM(soi.quantity) as total_items_sold,
    SUM(soi.gross_profit) as total_gross_profit,
    AVG(soi.price_map_rate) as avg_price_map_rate
FROM 
    (SELECT * FROM public.sales_orders_deprecated 
     UNION ALL 
     SELECT * FROM public.sales_orders 
     WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders' AND table_schema = 'public')
    ) so
    LEFT JOIN stores s ON s.id = so.store_id
    LEFT JOIN (
        SELECT * FROM public.sales_order_items_deprecated 
        UNION ALL 
        SELECT * FROM public.sales_order_items 
        WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_order_items' AND table_schema = 'public')
    ) soi ON soi.sales_order_id = so.id
WHERE so.status != 'cancelled'
GROUP BY 
    DATE_TRUNC('day', so.order_date),
    so.store_id,
    s.store_name,
    so.customer_source;

COMMENT ON VIEW public.vw_sales_summary IS 'Sales summary with source filtering for pivot analysis. Supports meeting requirements for source-based reporting.';

-- ===== INVENTORY VIEW =====

-- Item-based inventory aggregation
CREATE OR REPLACE VIEW public.vw_inventory AS
SELECT 
    p.id as product_id,
    i.currentStoreId as store_id,
    p.sku,
    p.product_name,
    p.brand,
    p.model,
    p.category,
    p.cost,
    p.price,
    p.map_price,
    COUNT(i.id) as quantity,
    COUNT(CASE WHEN i.status = 'in_stock' THEN 1 END) as available_quantity,
    COUNT(CASE WHEN i.status = 'reserved' THEN 1 END) as reserved_quantity,
    COUNT(CASE WHEN i.status = 'sold' THEN 1 END) as sold_quantity,
    -- Compatibility with old inventory table structure
    10 as reorder_point,  -- Default value
    100 as max_stock,     -- Default value
    MAX(i.updatedAt) as last_counted_at,
    NOW() as updated_at
FROM 
    public.products p
    LEFT JOIN public."Item" i ON i."productId" = p.id::text
WHERE 
    i."delete" IS NOT TRUE OR i."delete" IS NULL
GROUP BY 
    p.id, i.currentStoreId, p.sku, p.product_name, p.brand, p.model, 
    p.category, p.cost, p.price, p.map_price;

COMMENT ON VIEW public.vw_inventory IS 'Item-based inventory aggregation replacing the legacy inventory table. Provides real-time stock counts.';

-- ===== WARRANTY VIEW =====

-- Warranty tracking from sales order data
CREATE OR REPLACE VIEW public.vw_warranties AS
SELECT 
    so.id as warranty_id,
    so.id as order_id,
    soi.id as line_item_id,
    soi.product_id,
    p.sku,
    p.product_name,
    so.customer_name,
    so.customer_email,
    so.customer_phone,
    so.store_id,
    s.store_name,
    so.order_date as purchase_date,
    so.warranty_years,
    so.warranty_amount,
    -- Calculate warranty periods
    so.order_date + INTERVAL '1 year' as standard_warranty_expires,
    CASE 
        WHEN so.warranty_years > 1 
        THEN so.order_date + (so.warranty_years || ' years')::INTERVAL 
        ELSE so.order_date + INTERVAL '1 year' 
    END as warranty_expires,
    -- Warranty status
    CASE 
        WHEN so.warranty_years > 1 THEN 'extended'
        ELSE 'standard'
    END as warranty_type,
    CASE 
        WHEN NOW() > (so.order_date + (so.warranty_years || ' years')::INTERVAL) THEN 'expired'
        WHEN NOW() > (so.order_date + INTERVAL '1 year') AND so.warranty_years = 1 THEN 'expired'
        ELSE 'active'
    END as warranty_status,
    -- Warranty disclaimer from system settings
    COALESCE(
        (SELECT setting_value FROM system_settings WHERE setting_key = 'repair_disclaimer'),
        'Standard warranty terms apply. Contact store for details.'
    ) as warranty_terms,
    so.created_at,
    so.updated_at
FROM 
    (SELECT * FROM public.sales_orders_deprecated 
     UNION ALL 
     SELECT * FROM public.sales_orders 
     WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders' AND table_schema = 'public')
    ) so
    LEFT JOIN (
        SELECT * FROM public.sales_order_items_deprecated 
        UNION ALL 
        SELECT * FROM public.sales_order_items 
        WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_order_items' AND table_schema = 'public')
    ) soi ON soi.sales_order_id = so.id
    LEFT JOIN products p ON p.id = soi.product_id
    LEFT JOIN stores s ON s.id = so.store_id
WHERE so.status = 'completed';

COMMENT ON VIEW public.vw_warranties IS 'Warranty tracking derived from sales order warranty fields. Replaces separate warranty tables.';

-- ===== SCRAP VIEWS =====

-- Scrap orders view (mapping to Prisma naming convention)
CREATE OR REPLACE VIEW public.vw_scrap_orders AS
SELECT 
    sh.id,
    sh.scrap_no as order_number,
    sh.store_id,
    sh.warehouse_id,
    sh.status,
    sh.total_qty,
    sh.total_value,
    sh.photo_urls,
    sh.created_by,
    sh.created_at,
    sh.updated_at,
    -- Line items count
    COALESCE(
        (SELECT COUNT(*) FROM scrap_lines_deprecated sl WHERE sl.header_id = sh.id),
        0
    ) as line_count
FROM 
    public.scrap_headers_deprecated sh;

COMMENT ON VIEW public.vw_scrap_orders IS 'Scrap orders view with Prisma naming convention. Maps scrap_headers to scrap_orders structure.';

-- Scrap lines view
CREATE OR REPLACE VIEW public.vw_scrap_lines AS
SELECT 
    sl.id,
    sl.header_id as order_id,
    sl.product_id,
    p.sku,
    p.product_name,
    sl.qty as quantity,
    sl.unit_cost,
    sl.reason,
    sl.batch_no,
    sl.uom,
    sl.attachment_id,
    sl.created_at,
    sl.updated_at
FROM 
    public.scrap_lines_deprecated sl
    LEFT JOIN products p ON p.id = sl.product_id;

COMMENT ON VIEW public.vw_scrap_lines IS 'Scrap line items view. Maps scrap_lines to standardized structure.';

-- ===== RETURNS VIEWS =====

-- Unified returns view (combining all return types)
CREATE OR REPLACE VIEW public.vw_returns_unified AS
SELECT 
    -- From ReturnOrder (new unified model)
    ro.id,
    ro.docNo as return_number,
    ro.storeId as store_id,
    ro.returnWHId as warehouse_id,
    ro.originalOrderId as order_id,
    ro.status,
    ro.refundMode as refund_mode,
    ro.isCustomerReturn as is_customer_return,
    ro.createdById as created_by,
    ro.createdAt as created_at,
    ro.updatedAt as updated_at,
    -- Calculate totals from lines
    COALESCE(
        (SELECT COUNT(*) FROM "ReturnLine" rl WHERE rl."orderId" = ro.id),
        0
    ) as line_count,
    'unified' as source_table
FROM 
    public."ReturnOrder" ro

UNION ALL

-- From legacy returns table
SELECT 
    r.id,
    r.return_number,
    r.store_id,
    NULL as warehouse_id,
    r.order_id,
    r.status,
    'ADJUSTED_PRICE' as refund_mode,
    true as is_customer_return,
    NULL as created_by,
    r.created_at,
    r.updated_at,
    r.number_of_items as line_count,
    'legacy_returns' as source_table
FROM 
    public.returns_deprecated r

UNION ALL

-- From after_sales_returns
SELECT 
    asr.id,
    NULL as return_number,
    asr.store_id,
    asr.warehouse_id,
    NULL as order_id,
    'completed' as status,
    'REFUND' as refund_mode,
    true as is_customer_return,
    NULL as created_by,
    asr.created_at,
    asr.updated_at,
    1 as line_count,
    'after_sales' as source_table
FROM 
    public.after_sales_returns_deprecated asr;

COMMENT ON VIEW public.vw_returns_unified IS 'Unified returns view combining ReturnOrder, legacy returns, and after_sales_returns data.';

-- ===== ENABLE RLS ON VIEWS =====

-- Enable RLS on views (inherits from underlying tables)
ALTER VIEW public.vw_sales_orders_list SET (security_invoker = true);
ALTER VIEW public.vw_sales_summary SET (security_invoker = true);
ALTER VIEW public.vw_inventory SET (security_invoker = true);
ALTER VIEW public.vw_warranties SET (security_invoker = true);
ALTER VIEW public.vw_scrap_orders SET (security_invoker = true);
ALTER VIEW public.vw_scrap_lines SET (security_invoker = true);
ALTER VIEW public.vw_returns_unified SET (security_invoker = true);

DO $$
BEGIN
    RAISE NOTICE 'Phase 2 Complete: All replacement views created successfully';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '- vw_sales_orders_list (replaces sales_orders)';
    RAISE NOTICE '- vw_sales_summary (aggregated sales with source filtering)';
    RAISE NOTICE '- vw_inventory (Item-based inventory)';
    RAISE NOTICE '- vw_warranties (warranty tracking from sales data)';
    RAISE NOTICE '- vw_scrap_orders (scrap management)';
    RAISE NOTICE '- vw_scrap_lines (scrap line items)';
    RAISE NOTICE '- vw_returns_unified (consolidated returns)';
    RAISE NOTICE 'Next Step: Test all /api/store/* endpoints for compatibility';
    RAISE NOTICE 'After testing: Run 003_drop_deprecated.sql (requires manual approval)';
END $$;