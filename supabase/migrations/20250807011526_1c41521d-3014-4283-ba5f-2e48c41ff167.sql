-- Fix the ambiguous repair_id reference in generate_repair_id function
DROP FUNCTION IF EXISTS generate_repair_id();

CREATE OR REPLACE FUNCTION generate_repair_id()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;