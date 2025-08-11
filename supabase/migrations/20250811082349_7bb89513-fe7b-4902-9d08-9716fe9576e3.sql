BEGIN;
-- 0) Ensure vw_sales_orders_list does not depend on customers.name
CREATE OR REPLACE VIEW public.vw_sales_orders_list AS
SELECT 
    so.id,
    so.order_number,
    so.customer_name,
    so.customer_email,
    so.customer_phone,
    so.customer_first,
    so.customer_last,
    so.addr_country,
    so.addr_state,
    so.addr_city,
    so.addr_street,
    so.addr_zipcode,
    so.order_date,
    so.status,
    so.total_amount,
    so.discount_amount,
    so.tax_amount,
    so.warranty_years,
    so.warranty_amount,
    so.walk_in_delivery,
    so.accessory,
    so.other_services,
    so.other_fee,
    so.payment_method,
    so.payment_note,
    so.customer_source,
    so.cashier_id,
    so.store_id,
    so.created_by,
    so.created_at,
    so.updated_at,
    -- Calculated fields
    COALESCE(
        (SELECT COUNT(*) FROM sales_order_items soi WHERE soi.sales_order_id = so.id), 
        0
    ) as line_count,
    COALESCE(
        (SELECT SUM(soi.quantity) FROM sales_order_items soi WHERE soi.sales_order_id = so.id),
        0
    ) as total_quantity,
    -- Extended warranty flag
    CASE WHEN so.warranty_years > 1 THEN true ELSE false END as has_extended_warranty
FROM 
    (SELECT * FROM public.sales_orders_deprecated 
     UNION ALL 
     SELECT 
         id, order_number, customer_name, customer_email, customer_phone,
         customer_first, customer_last, addr_country, addr_state, addr_city,
         addr_street, addr_zipcode, order_date, status, total_amount,
         discount_amount, tax_amount, warranty_years, warranty_amount,
         walk_in_delivery, accessory, other_services, other_fee,
         payment_method, payment_note, customer_source, cashier_id,
         store_id, created_by, created_at, updated_at
     FROM public.sales_orders 
     WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders' AND table_schema = 'public')
    ) so;

COMMENT ON VIEW public.vw_sales_orders_list IS 'Legacy sales_orders API compatibility view. Combines deprecated table data with current schema.';
ALTER VIEW public.vw_sales_orders_list SET (security_invoker = true);

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