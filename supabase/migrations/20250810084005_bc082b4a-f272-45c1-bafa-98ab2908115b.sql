-- Create compatibility views for old modules

-- 1. Inventory compatibility view mapping Item fields
CREATE OR REPLACE VIEW vw_inventory AS
SELECT 
  i.id,
  i.a4lCode as sku,
  i.epc,
  i.serialNo as serial_no,
  i.status,
  i.currentStoreId as store_id,
  i.loadDate as load_date,
  p.brand,
  p.model,
  p.kwCode as kw_code,
  p.mapPrice as map_price,
  i.gradeLabel as grade_label,
  i.createdAt as created_at,
  i.updatedAt as updated_at
FROM "Item" i
LEFT JOIN "Product" p ON i.productId = p.id
WHERE i.delete IS NULL OR i.delete = false;

-- 2. Warranty compatibility view from RetailLine
CREATE OR REPLACE VIEW vw_warranties AS
SELECT 
  rl.id,
  ro.docNo as claim_no,
  'active'::text as status,
  ro.customerId as customer_id,
  ro.storeId as store_id,
  ro.createdAt as created_at,
  ro.updatedAt as updated_at,
  rl.isExtendedWarranty as is_extended_warranty,
  rl.warrantyAmount as warranty_amount,
  rl.extWarrantyMonths as ext_warranty_months,
  rl.warrantyCardNo as warranty_card_no,
  rl.warrantyStartAt as warranty_start_at,
  rl.warrantyEndAt as warranty_end_at,
  c.firstName as customer_first_name,
  c.lastName as customer_last_name,
  s.name as store_name,
  p.brand as product_brand,
  p.model as product_model
FROM "RetailLine" rl
JOIN "RetailOrder" ro ON rl.orderId = ro.id
LEFT JOIN "Customer" c ON ro.customerId = c.id
LEFT JOIN "Store" s ON ro.storeId = s.id
LEFT JOIN "Item" i ON rl.itemId = i.id
LEFT JOIN "Product" p ON i.productId = p.id
WHERE rl.isExtendedWarranty = true
  AND (rl.delete IS NULL OR rl.delete = false)
  AND (ro.delete IS NULL OR ro.delete = false);

-- 3. Unified returns view combining ReturnOrder logic
CREATE OR REPLACE VIEW vw_returns_unified AS
SELECT 
  ro.id,
  ro.docNo as return_number,
  'unified'::text as return_type,
  ro.status,
  ro.isCustomerReturn as is_customer_return,
  ro.returnWHId as return_wh_id,
  CASE WHEN ro.isCustomerReturn = true THEN 'customer-return'
       WHEN ro.returnWHId IS NOT NULL THEN 'hq-return'
       ELSE 'store-return' END as return_category,
  ro.storeId as store_id,
  ro.originalOrderId as original_order_id,
  ro.createdAt as created_at,
  ro.updatedAt as updated_at,
  s.name as store_name,
  orig_c.firstName as customer_first_name,
  orig_c.lastName as customer_last_name
FROM "ReturnOrder" ro
LEFT JOIN "Store" s ON ro.storeId = s.id
LEFT JOIN "RetailOrder" orig_ro ON ro.originalOrderId = orig_ro.id
LEFT JOIN "Customer" orig_c ON orig_ro.customerId = orig_c.id
WHERE ro.delete IS NULL OR ro.delete = false;

-- 4. Purchase requests compatibility (already covered by Prisma models above)
-- Tables will be created by Prisma migration

-- 5. Sales orders list view with extended fields
CREATE OR REPLACE VIEW vw_sales_orders_list AS
SELECT 
  ro.id,
  ro.docNo as order_number,
  ro.status,
  ro.orderType as order_type,
  ro.storeId as store_id,
  ro.customerId as customer_id,
  ro.customerFirstName as customer_first_name,
  ro.customerLastName as customer_last_name,
  ro.cashierFirstName as cashier_first_name,
  ro.cashierLastName as cashier_last_name,
  ro.source as customer_source,
  ro.fulfillmentType as walk_in_delivery,
  ro.deliveredOn as delivery_date,
  ro.deliveryFee as delivery_fee,
  ro.accessoryFee as accessory_fee,
  ro.otherFee as other_fee,
  ro.payment1Method as payment_method1,
  ro.payment1Amount as payment_amount1,
  ro.payment2Method as payment_method2,
  ro.payment2Amount as payment_amount2,
  ro.payment3Method as payment_method3,
  ro.payment3Amount as payment_amount3,
  ro.taxRate as tax_rate,
  ro.deposit,
  ro.createdAt as order_date,
  ro.createdAt as created_at,
  ro.updatedAt as updated_at,
  s.name as store_name,
  c.firstName as customer_first,
  c.lastName as customer_last,
  c.email as customer_email,
  c.phone as customer_phone,
  -- Aggregate calculations
  COALESCE(SUM(rl.unitPrice * 1), 0) as total_amount,
  COALESCE(SUM(rl.mapAtSale), 0) as total_map,
  COALESCE(SUM(rl.warrantyAmount), 0) as warranty_amount,
  COALESCE(MAX(CASE WHEN rl.isExtendedWarranty THEN 1 ELSE 0 END), 0) as has_extended_warranty,
  COALESCE(AVG(CASE WHEN rl.unitPrice > 0 AND rl.mapAtSale > 0 THEN rl.unitPrice / rl.mapAtSale ELSE NULL END), 0) as avg_price_map_rate,
  COALESCE(SUM(rl.grossProfit), 0) as total_gross_profit
FROM "RetailOrder" ro
LEFT JOIN "Store" s ON ro.storeId = s.id
LEFT JOIN "Customer" c ON ro.customerId = c.id
LEFT JOIN "RetailLine" rl ON ro.id = rl.orderId AND (rl.delete IS NULL OR rl.delete = false)
WHERE ro.delete IS NULL OR ro.delete = false
GROUP BY ro.id, s.name, c.firstName, c.lastName, c.email, c.phone;

-- 6. Sales summary view for pivot analysis
CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT 
  DATE(ro.createdAt) as sale_date,
  ro.storeId as store_id,
  s.name as store_name,
  ro.source as customer_source,
  COUNT(DISTINCT ro.id) as order_count,
  SUM(rl.unitPrice) as total_sales,
  SUM(rl.mapAtSale) as total_map,
  SUM(rl.warrantyAmount) as total_warranty,
  SUM(rl.grossProfit) as total_profit,
  AVG(rl.unitPrice / NULLIF(rl.mapAtSale, 0)) as avg_price_map_rate
FROM "RetailOrder" ro
LEFT JOIN "Store" s ON ro.storeId = s.id
LEFT JOIN "RetailLine" rl ON ro.id = rl.orderId AND (rl.delete IS NULL OR rl.delete = false)
WHERE ro.delete IS NULL OR ro.delete = false
GROUP BY DATE(ro.createdAt), ro.storeId, s.name, ro.source;