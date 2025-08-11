BEGIN;
-- Recreate vw_sales_orders_list without dependency on customers table
CREATE OR REPLACE VIEW public.vw_sales_orders_list AS
SELECT 
  so.id,
  so.order_number,
  so.order_date,
  so.status,
  so.total_amount,
  so.discount_amount,
  so.tax_amount,
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
  COALESCE((SELECT COUNT(*) FROM public.sales_order_items soi WHERE soi.sales_order_id = so.id), 0) AS line_count,
  COALESCE((SELECT SUM(soi.quantity) FROM public.sales_order_items soi WHERE soi.sales_order_id = so.id), 0) AS total_quantity,
  CASE WHEN so.warranty_years > 1 THEN true ELSE false END AS has_extended_warranty
FROM public.sales_orders so;

COMMENT ON VIEW public.vw_sales_orders_list IS 'Sales orders list view without dependency on customers table.';
ALTER VIEW public.vw_sales_orders_list SET (security_invoker = true);

-- Remove sync triggers/functions again to be safe
DROP TRIGGER IF EXISTS trg_sync_customer_name_fields ON public.customers;
DROP FUNCTION IF EXISTS public.sync_customer_name_fields();
DROP TRIGGER IF EXISTS trg_sync_profile_name_fields ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_name_fields();

-- Drop old single-name columns
ALTER TABLE public.customers DROP COLUMN IF EXISTS name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;

-- Update handle_new_user to use first/last name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, email, first_name, last_name, role, store_id, is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'store_employee')::user_role,
    CASE WHEN NEW.raw_user_meta_data ->> 'store_id' IS NOT NULL AND NEW.raw_user_meta_data ->> 'store_id' != '' THEN (NEW.raw_user_meta_data ->> 'store_id')::uuid ELSE NULL END,
    true
  );

  INSERT INTO public.user_roles (user_id, role, store_id, warehouse_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'store_employee')::user_role,
    CASE WHEN NEW.raw_user_meta_data ->> 'store_id' IS NOT NULL AND NEW.raw_user_meta_data ->> 'store_id' != '' THEN (NEW.raw_user_meta_data ->> 'store_id')::uuid ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data ->> 'warehouse_id' IS NOT NULL AND NEW.raw_user_meta_data ->> 'warehouse_id' != '' THEN (NEW.raw_user_meta_data ->> 'warehouse_id')::uuid ELSE NULL END
  );

  RETURN NEW;
END;
$$;

COMMIT;