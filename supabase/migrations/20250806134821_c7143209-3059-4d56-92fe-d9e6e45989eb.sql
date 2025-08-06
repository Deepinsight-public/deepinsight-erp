-- Create scrap stock management tables
CREATE TABLE public.scrap_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrap_no VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'l1_approved', 'final_approved', 'posted', 'rejected', 'cancelled')),
  store_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_qty INTEGER NOT NULL DEFAULT 0,
  total_value DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.scrap_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_id UUID NOT NULL REFERENCES public.scrap_headers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  batch_no VARCHAR(100),
  qty INTEGER NOT NULL CHECK (qty > 0),
  uom VARCHAR(20) NOT NULL DEFAULT 'ea',
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  reason VARCHAR(100) NOT NULL,
  attachment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.scrap_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_id UUID NOT NULL REFERENCES public.scrap_headers(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('submit', 'approve_l1', 'approve_final', 'reject', 'cancel', 'post', 'reverse')),
  actor_id UUID NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrap_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrap_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrap_audit ENABLE ROW LEVEL SECURITY;

-- Create policies for scrap_headers
CREATE POLICY "Store users can view their store scrap headers"
  ON public.scrap_headers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.store_id = scrap_headers.store_id
  ));

CREATE POLICY "Store users can create scrap headers for their store"
  ON public.scrap_headers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.store_id = scrap_headers.store_id
  ));

CREATE POLICY "Store users can update their store scrap headers"
  ON public.scrap_headers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.store_id = scrap_headers.store_id
  ));

-- Create policies for scrap_lines
CREATE POLICY "Store users can view their store scrap lines"
  ON public.scrap_lines FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM scrap_headers sh 
    JOIN profiles p ON p.user_id = auth.uid() AND p.store_id = sh.store_id
    WHERE sh.id = scrap_lines.header_id
  ));

CREATE POLICY "Store users can create scrap lines"
  ON public.scrap_lines FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM scrap_headers sh 
    JOIN profiles p ON p.user_id = auth.uid() AND p.store_id = sh.store_id
    WHERE sh.id = scrap_lines.header_id
  ));

CREATE POLICY "Store users can update scrap lines"
  ON public.scrap_lines FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM scrap_headers sh 
    JOIN profiles p ON p.user_id = auth.uid() AND p.store_id = sh.store_id
    WHERE sh.id = scrap_lines.header_id
  ));

CREATE POLICY "Store users can delete scrap lines"
  ON public.scrap_lines FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM scrap_headers sh 
    JOIN profiles p ON p.user_id = auth.uid() AND p.store_id = sh.store_id
    WHERE sh.id = scrap_lines.header_id
  ));

-- Create policies for scrap_audit
CREATE POLICY "Store users can view their store scrap audit"
  ON public.scrap_audit FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM scrap_headers sh 
    JOIN profiles p ON p.user_id = auth.uid() AND p.store_id = sh.store_id
    WHERE sh.id = scrap_audit.header_id
  ));

CREATE POLICY "Store users can create scrap audit"
  ON public.scrap_audit FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM scrap_headers sh 
    JOIN profiles p ON p.user_id = auth.uid() AND p.store_id = sh.store_id
    WHERE sh.id = scrap_audit.header_id
  ));

-- Create indexes for performance
CREATE INDEX idx_scrap_headers_store_id ON public.scrap_headers(store_id);
CREATE INDEX idx_scrap_headers_status ON public.scrap_headers(status);
CREATE INDEX idx_scrap_lines_header_id ON public.scrap_lines(header_id);
CREATE INDEX idx_scrap_lines_product_id ON public.scrap_lines(product_id);
CREATE INDEX idx_scrap_audit_header_id ON public.scrap_audit(header_id);

-- Create triggers for updated_at
CREATE TRIGGER update_scrap_headers_updated_at
  BEFORE UPDATE ON public.scrap_headers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scrap_lines_updated_at
  BEFORE UPDATE ON public.scrap_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate scrap numbers
CREATE OR REPLACE FUNCTION public.generate_scrap_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  scrap_number TEXT;
BEGIN
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(scrap_no FROM 'SCR-\d{8}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.scrap_headers
  WHERE scrap_no LIKE 'SCR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  -- Generate the scrap number: SCR-YYYYMMDD-NNNN
  scrap_number := 'SCR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN scrap_number;
END;
$$;