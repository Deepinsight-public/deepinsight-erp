-- Fix all remaining functions to have proper search path
-- Update update_updated_at_column function to use proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function to use proper search path  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
$function$;