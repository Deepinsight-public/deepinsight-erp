-- Temporarily disable RLS for sales_orders table to allow testing without authentication
ALTER TABLE public.sales_orders DISABLE ROW LEVEL SECURITY;

-- Also disable RLS for sales_order_items
ALTER TABLE public.sales_order_items DISABLE ROW LEVEL SECURITY;