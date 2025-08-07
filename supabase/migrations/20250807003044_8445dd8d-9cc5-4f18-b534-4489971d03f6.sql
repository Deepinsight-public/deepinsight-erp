-- Add sales_order_id to repairs table to link repairs with original orders
ALTER TABLE public.repairs 
ADD COLUMN sales_order_id uuid REFERENCES public.sales_orders(id);

-- Add index for better performance when looking up repairs by order
CREATE INDEX idx_repairs_sales_order_id ON public.repairs(sales_order_id);

-- Add warranty_status field to track warranty coverage
ALTER TABLE public.repairs 
ADD COLUMN warranty_status varchar(20) DEFAULT 'unknown';

-- Add warranty_expires_at to track when warranty expires  
ALTER TABLE public.repairs
ADD COLUMN warranty_expires_at timestamp with time zone;