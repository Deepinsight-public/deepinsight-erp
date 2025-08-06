-- Create warehouse inventory table for real products
CREATE TABLE public.warehouse_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID NOT NULL,
  sku VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  qty_available INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_warehouse_inventory_warehouse_sku ON public.warehouse_inventory(warehouse_id, sku);

-- Enable RLS
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for warehouse inventory
CREATE POLICY "Store users can view warehouse inventory" 
ON public.warehouse_inventory 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id IS NOT NULL
));

-- Add trigger for updated_at
CREATE TRIGGER update_warehouse_inventory_updated_at
BEFORE UPDATE ON public.warehouse_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.warehouse_inventory (warehouse_id, sku, name, price, qty_available) VALUES
('00000000-0000-0000-0000-000000000001', 'SKU-A123', 'Product A - Premium Widget', 499.00, 100),
('00000000-0000-0000-0000-000000000001', 'SKU-B456', 'Product B - Standard Widget', 349.00, 60),
('00000000-0000-0000-0000-000000000001', 'SKU-C789', 'Product C - Basic Widget', 199.00, 80),
('00000000-0000-0000-0000-000000000001', 'SKU-D101', 'Product D - Deluxe Kit', 699.00, 45),
('00000000-0000-0000-0000-000000000001', 'SKU-E202', 'Product E - Starter Pack', 149.00, 120);