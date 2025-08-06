-- Fix the handle_new_user function to properly handle warehouse_id casting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    role,
    store_id,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
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
$function$