-- Fix warehouse inventory data - update to correct warehouse ID
UPDATE public.warehouse_inventory 
SET warehouse_id = '11111111-1111-1111-1111-111111111111'
WHERE warehouse_id = '00000000-0000-0000-0000-000000000001';

-- Insert fresh sample data for the correct warehouse
INSERT INTO public.warehouse_inventory (warehouse_id, sku, name, price, qty_available) VALUES
('11111111-1111-1111-1111-111111111111', 'SKU-A123', 'Product A - Premium Widget', 499.00, 100),
('11111111-1111-1111-1111-111111111111', 'SKU-B456', 'Product B - Standard Widget', 349.00, 60),
('11111111-1111-1111-1111-111111111111', 'SKU-C789', 'Product C - Basic Widget', 199.00, 80),
('11111111-1111-1111-1111-111111111111', 'SKU-D101', 'Product D - Deluxe Kit', 699.00, 45),
('11111111-1111-1111-1111-111111111111', 'SKU-E202', 'Product E - Starter Pack', 149.00, 120);