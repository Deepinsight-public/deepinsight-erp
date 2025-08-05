-- Add customer and order details columns to sales_orders table
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS customer_first VARCHAR,
ADD COLUMN IF NOT EXISTS customer_last VARCHAR,
ADD COLUMN IF NOT EXISTS addr_country VARCHAR,
ADD COLUMN IF NOT EXISTS addr_state VARCHAR,
ADD COLUMN IF NOT EXISTS addr_city VARCHAR,
ADD COLUMN IF NOT EXISTS addr_street VARCHAR,
ADD COLUMN IF NOT EXISTS addr_zipcode VARCHAR,
ADD COLUMN IF NOT EXISTS warranty_years INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS warranty_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS walk_in_delivery VARCHAR DEFAULT 'walk-in',
ADD COLUMN IF NOT EXISTS accessory TEXT,
ADD COLUMN IF NOT EXISTS other_services TEXT,
ADD COLUMN IF NOT EXISTS other_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_note TEXT,
ADD COLUMN IF NOT EXISTS customer_source VARCHAR,
ADD COLUMN IF NOT EXISTS cashier_id UUID,
ADD COLUMN IF NOT EXISTS order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_date_status ON public.sales_orders(order_date, status);

-- Update existing records to have default values
UPDATE public.sales_orders 
SET 
  warranty_years = 1 
WHERE warranty_years IS NULL;

UPDATE public.sales_orders 
SET 
  walk_in_delivery = 'walk-in' 
WHERE walk_in_delivery IS NULL;

UPDATE public.sales_orders 
SET 
  order_date = created_at 
WHERE order_date IS NULL;