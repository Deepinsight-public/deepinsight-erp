-- Fix purchase turns to follow the correct store order
-- 测试门店 should go first, then 上海中心店

-- First, let's update the current store to be 测试门店 (STORE001)
UPDATE purchase_turns 
SET current_store_id = '550e8400-e29b-41d4-a716-446655440000',
    round_number = 1,
    updated_at = now()
WHERE warehouse_id = '11111111-1111-1111-1111-111111111111';

-- If no turn exists, create one with 测试门店 as the current store
INSERT INTO purchase_turns (
  warehouse_id, 
  current_store_id, 
  round_number, 
  created_at, 
  updated_at
) 
SELECT 
  '11111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  1,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM purchase_turns 
  WHERE warehouse_id = '11111111-1111-1111-1111-111111111111'
);