-- Create sales summary view with dimensions and metrics
CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT 
    -- Dimensions
    DATE(so.order_date) as order_date,
    so.store_id,
    s.store_name,
    so.customer_source as source,
    so.cashier_id,
    p_cashier.full_name as cashier_name,
    prod.category as product_type,
    
    -- Metrics - Order level
    so.id as order_id,
    so.order_number,
    so.total_amount as transaction_amount,
    so.warranty_amount,
    so.other_fee as other_fee,
    
    -- Metrics - Item level aggregated
    COALESCE(SUM(soi.quantity), 0) as total_quantity,
    COALESCE(SUM(soi.total_amount), 0) as items_total_amount,
    COALESCE(SUM(soi.map_at_sale * soi.quantity), 0) as total_map,
    COALESCE(SUM(soi.unit_cost_at_sale * soi.quantity), 0) as total_cost,
    COALESCE(SUM(soi.gross_profit * soi.quantity), 0) as total_gross_profit,
    
    -- Calculate price/MAP ratio (weighted average)
    CASE 
        WHEN SUM(soi.map_at_sale * soi.quantity) > 0 
        THEN SUM(soi.unit_price * soi.quantity) / SUM(soi.map_at_sale * soi.quantity)
        ELSE 0 
    END as price_map_ratio,
    
    -- Additional fees broken down
    CASE 
        WHEN so.walk_in_delivery != 'walk-in' THEN so.other_fee 
        ELSE 0 
    END as delivery_fee,
    
    CASE 
        WHEN so.accessory IS NOT NULL AND so.accessory != '' THEN so.other_fee 
        ELSE 0 
    END as accessory_fee,
    
    -- Timestamps
    so.order_date,
    so.created_at,
    so.updated_at

FROM sales_orders so
LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
LEFT JOIN products prod ON soi.product_id = prod.id
LEFT JOIN stores s ON so.store_id = s.id
LEFT JOIN profiles p_cashier ON so.cashier_id = p_cashier.user_id
WHERE so.status NOT IN ('cancelled', 'draft')
GROUP BY 
    so.id, so.order_number, so.order_date, so.store_id, s.store_name,
    so.customer_source, so.cashier_id, p_cashier.full_name, prod.category,
    so.total_amount, so.warranty_amount, so.other_fee, so.walk_in_delivery,
    so.accessory, so.created_at, so.updated_at;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vw_sales_summary_date ON sales_orders(DATE(order_date));
CREATE INDEX IF NOT EXISTS idx_vw_sales_summary_store_date ON sales_orders(store_id, DATE(order_date));
CREATE INDEX IF NOT EXISTS idx_vw_sales_summary_source ON sales_orders(customer_source);

-- Enable RLS on the view (inherits from underlying tables)
-- The view will automatically respect RLS policies from sales_orders table