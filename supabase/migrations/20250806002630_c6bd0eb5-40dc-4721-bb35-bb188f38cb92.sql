-- Create returns table for after-sales module
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  return_number TEXT,
  order_id UUID,
  customer_id UUID,
  customer_name TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  total_map DECIMAL(10,2) DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  number_of_items INTEGER DEFAULT 0,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Create policies for store-level access
CREATE POLICY "Store users can view their store returns" 
ON public.returns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = returns.store_id
));

CREATE POLICY "Store users can create returns for their store" 
ON public.returns 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = returns.store_id
));

CREATE POLICY "Store users can update their store returns" 
ON public.returns 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = returns.store_id
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_returns_updated_at
BEFORE UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();