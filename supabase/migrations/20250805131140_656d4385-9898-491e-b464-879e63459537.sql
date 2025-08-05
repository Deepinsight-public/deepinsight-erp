-- Insert dummy data for testing round-robin purchase requests

-- First, insert a warehouse allocation with available inventory
INSERT INTO public.warehouse_allocations (warehouse_id, sku, qty_total, qty_left) VALUES
('11111111-1111-1111-1111-111111111111', 'SKU001', 100, 80),
('11111111-1111-1111-1111-111111111111', 'SKU002', 50, 45),
('11111111-1111-1111-1111-111111111111', 'SKU003', 200, 150);

-- Set up the purchase turn so current store can order
INSERT INTO public.purchase_turns (warehouse_id, current_store_id, round_number) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1);

-- Add some sample products for testing
INSERT INTO public.products (sku, product_name, brand, category, price, cost, is_active) VALUES
('SKU001', 'iPhone 15 Pro Max', 'Apple', 'Smartphones', 1199.99, 899.99, true),
('SKU002', 'Samsung Galaxy S24', 'Samsung', 'Smartphones', 999.99, 749.99, true),
('SKU003', 'MacBook Air M2', 'Apple', 'Laptops', 1299.99, 999.99, true);