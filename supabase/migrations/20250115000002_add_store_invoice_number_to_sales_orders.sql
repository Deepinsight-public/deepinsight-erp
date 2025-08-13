-- Add store_invoice_number field to sales_orders table
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS store_invoice_number VARCHAR;

-- Add comment to document the field
COMMENT ON COLUMN public.sales_orders.store_invoice_number IS 'Custom invoice number created by store manager for their own records';

-- Create index for faster searches on store invoice numbers
CREATE INDEX IF NOT EXISTS idx_sales_orders_store_invoice_number 
ON public.sales_orders(store_invoice_number) 
WHERE store_invoice_number IS NOT NULL;