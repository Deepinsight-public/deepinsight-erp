-- Create repairs table
CREATE TABLE public.repairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_id VARCHAR UNIQUE NOT NULL,
  store_id UUID NOT NULL,
  product_id UUID NOT NULL,
  customer_id UUID,
  customer_name VARCHAR,
  type VARCHAR NOT NULL CHECK (type IN ('warranty', 'paid', 'goodwill')),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  description TEXT NOT NULL,
  cost NUMERIC,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

-- Create policies for repairs (store-based access)
CREATE POLICY "Store users can view their store repairs" 
ON public.repairs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = repairs.store_id
));

CREATE POLICY "Store users can create repairs for their store" 
ON public.repairs 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = repairs.store_id
));

CREATE POLICY "Store users can update their store repairs" 
ON public.repairs 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.store_id = repairs.store_id
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_repairs_updated_at
BEFORE UPDATE ON public.repairs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate repair IDs
CREATE OR REPLACE FUNCTION public.generate_repair_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  repair_id TEXT;
BEGIN
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(repair_id FROM 'REP-\d{8}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.repairs
  WHERE repair_id LIKE 'REP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  -- Generate the repair ID: REP-YYYYMMDD-NNNN
  repair_id := 'REP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN repair_id;
END;
$function$;