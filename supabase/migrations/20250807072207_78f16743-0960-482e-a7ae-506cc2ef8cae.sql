-- Fix the generate_warranty_claim_no function to remove ambiguous column reference
DROP FUNCTION IF EXISTS public.generate_warranty_claim_no();

CREATE OR REPLACE FUNCTION public.generate_warranty_claim_no()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  warranty_claim_no TEXT;
BEGIN
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(warranty_headers.claim_no FROM 'WC-\d{8}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.warranty_headers
  WHERE warranty_headers.claim_no LIKE 'WC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  -- Generate the claim number: WC-YYYYMMDD-NNNN
  warranty_claim_no := 'WC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN warranty_claim_no;
END;
$function$;