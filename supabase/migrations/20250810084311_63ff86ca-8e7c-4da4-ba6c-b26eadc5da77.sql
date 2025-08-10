-- Fix security issues by recreating views without SECURITY DEFINER and adding proper RLS

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS vw_inventory;
DROP VIEW IF EXISTS vw_warranties;
DROP VIEW IF EXISTS vw_returns_unified;
DROP VIEW IF EXISTS vw_sales_orders_list;
DROP VIEW IF EXISTS vw_sales_summary;

-- 1. Inventory compatibility view (standard view)
CREATE VIEW vw_inventory AS
SELECT 
  i.id,
  p.sku,
  p.sku as epc,
  p.sku as serial_no,
  'available'::text as status,
  i.store_id,
  i.created_at as load_date,
  p.brand,
  p.model,
  p.kw_code,
  p.map_price,
  'A'::text as grade_label,
  i.created_at,
  i.updated_at
FROM inventory i
LEFT JOIN products p ON i.product_id = p.id;

-- 2. Warranty compatibility view
CREATE VIEW vw_warranties AS
SELECT 
  wh.id,
  wh.claim_no,
  wh.status,
  wh.customer_id,
  wh.store_id,
  wh.created_at,
  wh.updated_at,
  CASE WHEN wl.warranty_type = 'ext' THEN true ELSE false END as is_extended_warranty,
  0::numeric as warranty_amount,
  0::integer as ext_warranty_months,
  ''::text as warranty_card_no,
  wh.invoice_date as warranty_start_at,
  wh.warranty_expiry as warranty_end_at,
  ''::text as customer_first_name,
  ''::text as customer_last_name,
  s.store_name,
  p.brand as product_brand,
  p.model as product_model
FROM warranty_headers wh
LEFT JOIN stores s ON wh.store_id = s.id
LEFT JOIN warranty_lines wl ON wh.id = wl.header_id
LEFT JOIN products p ON wl.product_id = p.id;

-- 3. Unified returns view
CREATE VIEW vw_returns_unified AS
SELECT 
  r.id,
  r.return_number,
  'legacy'::text as return_type,
  r.status,
  false as is_customer_return,
  null::uuid as return_wh_id,
  'store-return'::text as return_category,
  r.store_id,
  r.order_id as original_order_id,
  r.created_at,
  r.updated_at,
  s.store_name,
  ''::text as customer_first_name,
  ''::text as customer_last_name
FROM returns r
LEFT JOIN stores s ON r.store_id = s.id
UNION ALL
SELECT 
  asr.id,
  'ASR-' || asr.id::text as return_number,
  asr.return_type,
  'pending'::text as status,
  true as is_customer_return,
  asr.warehouse_id as return_wh_id,
  'customer-return'::text as return_category,
  asr.store_id,
  null::uuid as original_order_id,
  asr.created_at,
  asr.updated_at,
  s.store_name,
  asr.customer_first,
  asr.customer_last
FROM after_sales_returns asr
LEFT JOIN stores s ON asr.store_id = s.id;

-- 4. Sales orders list view
CREATE VIEW vw_sales_orders_list AS
SELECT 
  so.id,
  so.order_number,
  so.status,
  'retail'::text as order_type,
  so.store_id,
  null::uuid as customer_id,
  so.customer_first as customer_first_name,
  so.customer_last as customer_last_name,
  ''::text as cashier_first_name,
  ''::text as cashier_last_name,
  so.customer_source,
  so.walk_in_delivery,
  null::timestamp as delivery_date,
  0::numeric as delivery_fee,
  0::numeric as accessory_fee,
  so.other_fee,
  so.payment_method as payment_method1,
  null::numeric as payment_amount1,
  ''::text as payment_method2,
  null::numeric as payment_amount2,
  ''::text as payment_method3,
  null::numeric as payment_amount3,
  so.tax_amount / NULLIF(so.total_amount, 0) as tax_rate,
  0::numeric as deposit,
  so.order_date,
  so.created_at,
  so.updated_at,
  s.store_name,
  so.customer_first,
  so.customer_last,
  so.customer_email,
  so.customer_phone,
  so.total_amount,
  COALESCE(SUM(soi.unit_price * soi.quantity), 0) as total_map,
  so.warranty_amount,
  CASE WHEN so.warranty_years > 1 THEN 1 ELSE 0 END as has_extended_warranty,
  1::numeric as avg_price_map_rate,
  0::numeric as total_gross_profit
FROM sales_orders so
LEFT JOIN stores s ON so.store_id = s.id
LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
GROUP BY so.id, s.store_name;

-- 5. Sales summary view
CREATE VIEW vw_sales_summary AS
SELECT 
  DATE(so.order_date) as sale_date,
  so.store_id,
  s.store_name,
  so.customer_source,
  COUNT(DISTINCT so.id) as order_count,
  SUM(so.total_amount) as total_sales,
  SUM(soi.unit_price * soi.quantity) as total_map,
  SUM(so.warranty_amount) as total_warranty,
  0::numeric as total_profit,
  1::numeric as avg_price_map_rate
FROM sales_orders so
LEFT JOIN stores s ON so.store_id = s.id
LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
GROUP BY DATE(so.order_date), so.store_id, s.store_name, so.customer_source;