-- Fix the function search path security warning
ALTER FUNCTION create_sales_order_with_stock_deduction(jsonb, jsonb[])
SET search_path = 'public';