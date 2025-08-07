-- Warranty Claims Database Schema
-- Create warranty headers table
CREATE TABLE public.warranty_headers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_no VARCHAR NOT NULL UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'draft',
  customer_id UUID,
  store_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sales_order_id UUID,
  invoice_date TIMESTAMP WITH TIME ZONE,
  warranty_expiry TIMESTAMP WITH TIME ZONE,
  fault_desc TEXT NOT NULL
);

-- Create warranty lines table
CREATE TABLE public.warranty_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  header_id UUID NOT NULL,
  product_id UUID NOT NULL,
  serial_no VARCHAR,
  qty INTEGER NOT NULL,
  uom VARCHAR NOT NULL DEFAULT 'ea',
  warranty_type VARCHAR NOT NULL,
  attachment VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty tech review table
CREATE TABLE public.warranty_tech (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  header_id UUID NOT NULL UNIQUE,
  diagnosis TEXT NOT NULL,
  solution VARCHAR NOT NULL,
  est_cost NUMERIC(12,2),
  inspected_by UUID NOT NULL,
  inspected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty resolution table
CREATE TABLE public.warranty_resolution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  header_id UUID NOT NULL UNIQUE,
  action VARCHAR NOT NULL,
  replacement_id UUID,
  credit_amount NUMERIC(12,2),
  vendor_rma VARCHAR,
  approved_by UUID NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty audit table
CREATE TABLE public.warranty_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  header_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  actor_id UUID NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_warranty_lines_header_id ON public.warranty_lines(header_id);
CREATE INDEX idx_warranty_audit_header_id ON public.warranty_audit(header_id);

-- Enable RLS
ALTER TABLE public.warranty_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_tech ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_resolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for warranty_headers
CREATE POLICY "Store users can view their store warranty claims" 
ON public.warranty_headers FOR SELECT 
USING (store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id)));

CREATE POLICY "Store users can create warranty claims for their store" 
ON public.warranty_headers FOR INSERT 
WITH CHECK (store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id)));

CREATE POLICY "Store users can update their store warranty claims" 
ON public.warranty_headers FOR UPDATE 
USING (store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id)));

-- Create RLS policies for warranty_lines
CREATE POLICY "Store users can view warranty lines for their store" 
ON public.warranty_lines FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_lines.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can create warranty lines for their store" 
ON public.warranty_lines FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_lines.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can update warranty lines for their store" 
ON public.warranty_lines FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_lines.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can delete warranty lines for their store" 
ON public.warranty_lines FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_lines.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

-- Create RLS policies for warranty_tech
CREATE POLICY "Store users can view warranty tech reviews" 
ON public.warranty_tech FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_tech.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can create warranty tech reviews" 
ON public.warranty_tech FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_tech.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can update warranty tech reviews" 
ON public.warranty_tech FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_tech.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

-- Create RLS policies for warranty_resolution
CREATE POLICY "Store users can view warranty resolutions" 
ON public.warranty_resolution FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_resolution.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can create warranty resolutions" 
ON public.warranty_resolution FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_resolution.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can update warranty resolutions" 
ON public.warranty_resolution FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_resolution.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

-- Create RLS policies for warranty_audit
CREATE POLICY "Store users can view warranty audit for their store" 
ON public.warranty_audit FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_audit.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

CREATE POLICY "Store users can create warranty audit entries" 
ON public.warranty_audit FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM warranty_headers wh 
  WHERE wh.id = warranty_audit.header_id 
  AND wh.store_id IN (SELECT get_user_profile.store_id FROM get_user_profile(auth.uid()) get_user_profile(role, store_id))
));

-- Create function to generate warranty claim numbers
CREATE OR REPLACE FUNCTION public.generate_warranty_claim_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  claim_no TEXT;
BEGIN
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(claim_no FROM 'WC-\d{8}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.warranty_headers
  WHERE claim_no LIKE 'WC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  -- Generate the claim number: WC-YYYYMMDD-NNNN
  claim_no := 'WC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN claim_no;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_warranty_headers_updated_at
  BEFORE UPDATE ON public.warranty_headers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warranty_lines_updated_at
  BEFORE UPDATE ON public.warranty_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warranty_tech_updated_at
  BEFORE UPDATE ON public.warranty_tech
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warranty_resolution_updated_at
  BEFORE UPDATE ON public.warranty_resolution
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();