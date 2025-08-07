-- Fix search path security issues in functions
-- Update generate_warranty_claim_no function to use proper search path
CREATE OR REPLACE FUNCTION public.generate_warranty_claim_no()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update generate_repair_id function to use proper search path
CREATE OR REPLACE FUNCTION public.generate_repair_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
    new_repair_id TEXT;
    counter INTEGER := 1;
    base_date TEXT;
BEGIN
    -- Get current date in YYYYMMDD format
    base_date := to_char(CURRENT_DATE, 'YYYYMMDD');
    
    -- Generate repair ID with format YYYYMMDD-XXX where XXX is a 3-digit counter
    LOOP
        new_repair_id := base_date || '-' || lpad(counter::text, 3, '0');
        
        -- Check if this repair ID already exists in the repairs table
        IF NOT EXISTS (SELECT 1 FROM public.repairs WHERE repairs.repair_id = new_repair_id) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RAISE EXCEPTION 'Unable to generate unique repair ID for date %', base_date;
        END IF;
    END LOOP;
    
    RETURN new_repair_id;
END;
$function$;