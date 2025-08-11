BEGIN;
-- 1) Remove sync triggers/functions that depend on deprecated columns
DROP TRIGGER IF EXISTS trg_sync_customer_name_fields ON public.customers;
DROP FUNCTION IF EXISTS public.sync_customer_name_fields();

DROP TRIGGER IF EXISTS trg_sync_profile_name_fields ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_name_fields();

-- 2) Drop old single-name columns so table won't contain both
ALTER TABLE public.customers DROP COLUMN IF EXISTS name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;

-- 3) Update signup trigger to populate first/last names instead of full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile with first/last name
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    store_id,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'store_employee')::user_role,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'store_id' IS NOT NULL AND NEW.raw_user_meta_data ->> 'store_id' != '' 
      THEN (NEW.raw_user_meta_data ->> 'store_id')::uuid
      ELSE NULL
    END,
    true
  );
  
  -- Create user role with proper UUID handling
  INSERT INTO public.user_roles (
    user_id,
    role,
    store_id,
    warehouse_id
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'store_employee')::user_role,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'store_id' IS NOT NULL AND NEW.raw_user_meta_data ->> 'store_id' != '' 
      THEN (NEW.raw_user_meta_data ->> 'store_id')::uuid
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'warehouse_id' IS NOT NULL AND NEW.raw_user_meta_data ->> 'warehouse_id' != '' 
      THEN (NEW.raw_user_meta_data ->> 'warehouse_id')::uuid
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;

COMMIT;