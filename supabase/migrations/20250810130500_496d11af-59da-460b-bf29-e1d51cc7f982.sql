-- Drop existing views if they exist to avoid conflicts
DROP VIEW IF EXISTS vw_sales_summary;
DROP VIEW IF EXISTS vw_returns_unified;
DROP VIEW IF EXISTS vw_inventory;
DROP VIEW IF EXISTS vw_sales_orders_list;

-- Create view for sales orders list with calculated fields
CREATE VIEW vw_sales_orders_list AS
SELECT 
  so.id,
  so.order_number,
  so.order_date,
  so.status,
  so.total_amount,
  so.discount_amount,
  so.tax_amount,
  so.customer_name,
  so.customer_first,
  so.customer_last,
  so.customer_email,
  so.customer_phone,
  so.addr_country,
  so.addr_state,
  so.addr_city,
  so.addr_street,
  so.addr_zipcode,
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
  -- Extended warranty indicator
  CASE WHEN so.warranty_years > 1 OR so.warranty_amount > 0 THEN true ELSE false END as has_extended_warranty,
  -- Calculate total gross profit from line items
  COALESCE(
    (SELECT SUM(soi.gross_profit * soi.quantity) 
     FROM sales_order_items soi 
     WHERE soi.sales_order_id = so.id), 
    0
  ) as total_gross_profit,
  -- Calculate average price/MAP rate from line items
  COALESCE(
    (SELECT AVG(soi.price_map_rate) 
     FROM sales_order_items soi 
     WHERE soi.sales_order_id = so.id AND soi.price_map_rate > 0), 
    0
  ) as avg_price_map_rate,
  -- Customer profile info
  c.company as customer_company,
  c.address as customer_address,
  -- Store info
  s.store_name,
  s.store_code
FROM sales_orders so
LEFT JOIN customers c ON c.name = so.customer_name AND c.store_id = so.store_id
LEFT JOIN stores s ON s.id = so.store_id;

-- Create view for inventory with product details
CREATE VIEW vw_inventory AS
SELECT 
  i.id,
  i.product_id,
  i.store_id,
  i.quantity,
  i.reserved_quantity,
  i.reorder_point,
  i.max_stock,
  i.last_counted_at,
  i.created_at,
  i.updated_at,
  -- Product details
  p.sku,
  p.product_name,
  p.brand,
  p.model,
  p.category,
  p.description,
  p.price,
  p.cost,
  p.map_price,
  p.barcode,
  p.kw_code,
  p.is_active,
  -- Store details
  s.store_name,
  s.store_code
FROM inventory i
JOIN products p ON p.id = i.product_id
JOIN stores s ON s.id = i.store_id;

-- Create unified view for returns (both types)
CREATE VIEW vw_returns_unified AS
-- Regular returns
SELECT 
  r.id,
  r.return_number,
  r.reason,
  r.status,
  r.refund_amount,
  r.store_id,
  r.customer_id,
  r.customer_name,
  r.order_id,
  r.items,
  r.number_of_items,
  r.total_map,
  r.created_at,
  r.updated_at,
  false as is_customer_return,
  NULL::uuid as warehouse_id,
  'REGULAR' as return_type
FROM returns r
UNION ALL
-- After sales returns (customer returns)
SELECT 
  asr.id,
  NULL as return_number,
  asr.reason,
  'pending' as status,
  asr.refund_amount,
  asr.store_id,
  NULL as customer_id,
  COALESCE(asr.customer_first || ' ' || asr.customer_last, '') as customer_name,
  NULL as order_id,
  NULL as items,
  1 as number_of_items,
  0 as total_map,
  asr.created_at,
  asr.updated_at,
  true as is_customer_return,
  asr.warehouse_id,
  asr.return_type
FROM after_sales_returns asr;

-- Create view for sales summary with aggregations
CREATE VIEW vw_sales_summary AS
SELECT 
  so.store_id,
  so.customer_source,
  DATE(so.order_date) as sales_date,
  so.status,
  COUNT(*) as order_count,
  SUM(so.total_amount) as total_sales,
  SUM(so.discount_amount) as total_discount,
  SUM(so.tax_amount) as total_tax,
  AVG(so.total_amount) as avg_order_value,
  -- Extended warranty metrics
  COUNT(CASE WHEN so.warranty_years > 1 OR so.warranty_amount > 0 THEN 1 END) as extended_warranty_count,
  SUM(CASE WHEN so.warranty_years > 1 OR so.warranty_amount > 0 THEN so.warranty_amount ELSE 0 END) as total_warranty_amount,
  -- Profitability metrics (for managers only)
  COALESCE(
    SUM(
      (SELECT SUM(soi.gross_profit * soi.quantity) 
       FROM sales_order_items soi 
       WHERE soi.sales_order_id = so.id)
    ), 
    0
  ) as total_gross_profit,
  -- Store info
  s.store_name,
  s.store_code
FROM sales_orders so
JOIN stores s ON s.id = so.store_id
GROUP BY 
  so.store_id, 
  so.customer_source, 
  DATE(so.order_date), 
  so.status,
  s.store_name,
  s.store_code;