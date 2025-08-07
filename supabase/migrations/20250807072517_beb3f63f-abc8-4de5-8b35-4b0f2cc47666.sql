-- Fix the remaining function search path issue
-- Update generate_scrap_number function to use proper search path
CREATE OR REPLACE FUNCTION public.generate_scrap_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;