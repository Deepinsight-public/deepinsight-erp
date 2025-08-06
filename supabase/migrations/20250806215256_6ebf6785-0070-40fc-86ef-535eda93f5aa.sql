-- Fix the search path for the repair ID generation function
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