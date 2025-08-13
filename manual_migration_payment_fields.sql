-- Manual migration to add individual payment method fields
-- Run this in your Supabase SQL Editor

ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS payment_method1 VARCHAR,
ADD COLUMN IF NOT EXISTS payment_amount1 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method2 VARCHAR,
ADD COLUMN IF NOT EXISTS payment_amount2 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method3 VARCHAR,
ADD COLUMN IF NOT EXISTS payment_amount3 DECIMAL(10,2);

-- Update any existing records that have payment_method to migrate to payment_method1
UPDATE public.sales_orders 
SET 
  payment_method1 = payment_method,
  payment_amount1 = total_amount
WHERE payment_method IS NOT NULL AND payment_method1 IS NULL;

-- Add some test data to verify the fix works
-- (Optional - for testing purposes only)
UPDATE public.sales_orders 
SET 
  payment_methods = '[{"method": "cash", "amount": 500}, {"method": "card", "amount": 300}]'::jsonb,
  payment_method1 = 'cash',
  payment_amount1 = 500,
  payment_method2 = 'card',
  payment_amount2 = 300
WHERE id IN (
  SELECT id FROM public.sales_orders 
  ORDER BY created_at DESC 
  LIMIT 1
);