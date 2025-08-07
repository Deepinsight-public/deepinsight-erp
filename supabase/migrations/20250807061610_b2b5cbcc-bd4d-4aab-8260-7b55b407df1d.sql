-- Fix security warning for function search path
CREATE OR REPLACE FUNCTION public.generate_warranty_claim_no()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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