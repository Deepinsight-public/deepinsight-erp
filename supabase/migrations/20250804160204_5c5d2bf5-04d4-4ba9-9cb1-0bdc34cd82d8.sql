-- Create a sample store for testing if it doesn't exist
INSERT INTO public.stores (id, store_code, store_name, address, region, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'STORE001',
  '测试门店',
  '北京市朝阳区测试街道123号',
  '华北',
  'active'
) ON CONFLICT (store_code) DO NOTHING;

-- Create sample products for testing if they don't exist
INSERT INTO public.products (id, sku, product_name, price, category, brand, is_active)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', 'FRIDGE001', '三星双门冰箱', 3299.99, '家电', '三星', true),
  ('660e8400-e29b-41d4-a716-446655440002', 'LAPTOP001', '联想ThinkPad笔记本电脑', 5899.99, '电脑', '联想', true),
  ('660e8400-e29b-41d4-a716-446655440003', 'PRINTER001', '惠普激光打印机', 1299.99, '办公设备', '惠普', true),
  ('660e8400-e29b-41d4-a716-446655440004', 'FRIDGE002', 'LG多门冰箱', 4599.99, '家电', 'LG', true),
  ('660e8400-e29b-41d4-a716-446655440005', 'DESKTOP001', '戴尔台式电脑', 3799.99, '电脑', '戴尔', true),
  ('660e8400-e29b-41d4-a716-446655440006', 'PRINTER002', '佳能彩色打印机', 1899.99, '办公设备', '佳能', true)
ON CONFLICT (sku) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  brand = EXCLUDED.brand,
  is_active = EXCLUDED.is_active;

-- Create inventory records for sample products
INSERT INTO public.inventory (product_id, store_id, quantity, reserved_quantity)
SELECT p.id, s.id, 
  CASE 
    WHEN p.sku = 'FRIDGE001' THEN 8
    WHEN p.sku = 'LAPTOP001' THEN 12
    WHEN p.sku = 'PRINTER001' THEN 15
    WHEN p.sku = 'FRIDGE002' THEN 6
    WHEN p.sku = 'DESKTOP001' THEN 10
    WHEN p.sku = 'PRINTER002' THEN 20
    ELSE 0
  END as quantity,
  0 as reserved_quantity
FROM public.products p
CROSS JOIN public.stores s
WHERE p.sku IN ('FRIDGE001', 'LAPTOP001', 'PRINTER001', 'FRIDGE002', 'DESKTOP001', 'PRINTER002')
  AND s.store_code = 'STORE001'
ON CONFLICT (product_id, store_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  reserved_quantity = EXCLUDED.reserved_quantity;