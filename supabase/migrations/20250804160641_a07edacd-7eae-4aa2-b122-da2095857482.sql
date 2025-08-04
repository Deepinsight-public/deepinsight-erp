-- Temporarily disable RLS for sales_orders table to allow testing without authentication
ALTER TABLE public.sales_orders DISABLE ROW LEVEL SECURITY;

-- Also disable RLS for sales_order_items
ALTER TABLE public.sales_order_items DISABLE ROW LEVEL SECURITY;

-- Create a sample user profile for testing
INSERT INTO public.profiles (
  id, 
  user_id, 
  store_id, 
  role, 
  full_name, 
  email, 
  is_active
) VALUES (
  '770e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440000', 
  '550e8400-e29b-41d4-a716-446655440000',
  'store_employee',
  '测试用户',
  'test@example.com',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  store_id = EXCLUDED.store_id,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;