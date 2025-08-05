-- Insert dummy data for testing round-robin purchase requests

-- First, insert a warehouse allocation with available inventory
INSERT INTO public.warehouse_allocations (id, warehouse_id, sku, qty_total, qty_left, created_at, updated_at) VALUES
('allocation-123', 'warehouse-123', 'SKU001', 100, 80, now(), now()),
('allocation-124', 'warehouse-123', 'SKU002', 50, 45, now(), now()),
('allocation-125', 'warehouse-123', 'SKU003', 200, 150, now(), now());

-- Set up the purchase turn so current store (store-123) can order
INSERT INTO public.purchase_turns (id, warehouse_id, current_store_id, round_number, created_at, updated_at) VALUES
('turn-123', 'warehouse-123', 'store-123', 1, now(), now());

-- Add some sample products for testing
INSERT INTO public.products (id, sku, product_name, brand, category, price, cost, is_active, created_at, updated_at) VALUES
('product-001', 'SKU001', 'iPhone 15 Pro Max', 'Apple', 'Smartphones', 1199.99, 899.99, true, now(), now()),
('product-002', 'SKU002', 'Samsung Galaxy S24', 'Samsung', 'Smartphones', 999.99, 749.99, true, now(), now()),
('product-003', 'SKU003', 'MacBook Air M2', 'Apple', 'Laptops', 1299.99, 999.99, true, now(), now());