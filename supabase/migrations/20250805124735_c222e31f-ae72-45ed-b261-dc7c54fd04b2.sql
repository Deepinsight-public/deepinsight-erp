-- Create warehouse allocations table for tracking inventory quotas
CREATE TABLE public.warehouse_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID NOT NULL,
  sku CHARACTER VARYING NOT NULL,
  qty_total INTEGER NOT NULL,
  qty_left INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase turns table for round-robin tracking
CREATE TABLE public.purchase_turns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID NOT NULL UNIQUE,
  current_store_id UUID NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase requests table for order history
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  allocation_id UUID NOT NULL,
  items JSONB NOT NULL, -- [{sku, qty}]
  status CHARACTER VARYING NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.warehouse_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for warehouse_allocations
CREATE POLICY "Store users can view warehouse allocations" 
ON public.warehouse_allocations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id IS NOT NULL
));

-- Create policies for purchase_turns
CREATE POLICY "Store users can view purchase turns" 
ON public.purchase_turns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id IS NOT NULL
));

-- Create policies for purchase_requests
CREATE POLICY "Store users can view their store purchase requests" 
ON public.purchase_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = purchase_requests.store_id
));

CREATE POLICY "Store users can create purchase requests for their store" 
ON public.purchase_requests 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = purchase_requests.store_id
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_warehouse_allocations_updated_at
BEFORE UPDATE ON public.warehouse_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_turns_updated_at
BEFORE UPDATE ON public.purchase_turns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at
BEFORE UPDATE ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_warehouse_allocations_warehouse_id ON public.warehouse_allocations(warehouse_id);
CREATE INDEX idx_warehouse_allocations_sku ON public.warehouse_allocations(sku);
CREATE INDEX idx_purchase_turns_warehouse_id ON public.purchase_turns(warehouse_id);
CREATE INDEX idx_purchase_requests_store_id ON public.purchase_requests(store_id);
CREATE INDEX idx_purchase_requests_warehouse_id ON public.purchase_requests(warehouse_id);