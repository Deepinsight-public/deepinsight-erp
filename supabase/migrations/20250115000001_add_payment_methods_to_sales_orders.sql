-- Add multiple payment method fields to sales_orders table
-- This migration adds support for up to 3 payment methods per order

ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_method1 VARCHAR,
ADD COLUMN IF NOT EXISTS payment_amount1 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method2 VARCHAR,
ADD COLUMN IF NOT EXISTS payment_amount2 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method3 VARCHAR,
ADD COLUMN IF NOT EXISTS payment_amount3 DECIMAL(10,2);

-- Create index on payment_methods JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_payment_methods ON public.sales_orders USING GIN (payment_methods);

-- Update any existing records that have payment_method to migrate to payment_method1
UPDATE public.sales_orders 
SET 
  payment_method1 = payment_method,
  payment_amount1 = total_amount
WHERE payment_method IS NOT NULL AND payment_method1 IS NULL;

COMMENT ON COLUMN public.sales_orders.payment_methods IS 'JSONB array of payment methods with structure: [{"method": "cash", "amount": 100.00, "note": "optional"}]';
COMMENT ON COLUMN public.sales_orders.payment_method1 IS 'First payment method (for backwards compatibility)';
COMMENT ON COLUMN public.sales_orders.payment_amount1 IS 'Amount for first payment method';
COMMENT ON COLUMN public.sales_orders.payment_method2 IS 'Second payment method';
COMMENT ON COLUMN public.sales_orders.payment_amount2 IS 'Amount for second payment method';
COMMENT ON COLUMN public.sales_orders.payment_method3 IS 'Third payment method';
COMMENT ON COLUMN public.sales_orders.payment_amount3 IS 'Amount for third payment method';