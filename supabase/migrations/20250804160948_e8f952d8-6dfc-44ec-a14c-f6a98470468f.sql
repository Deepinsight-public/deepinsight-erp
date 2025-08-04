-- Re-enable RLS for security
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

-- Fix the existing function to have proper search path
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid uuid)
 RETURNS TABLE(role user_role, store_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.role, p.store_id
  FROM public.profiles p
  WHERE p.user_id = user_uuid;
$function$;

-- Fix the other function as well
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;