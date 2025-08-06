-- Update the function to handle both profile and user roles creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    (NEW.raw_user_meta_data ->> 'store_id')::uuid,
    true
  );
  
  -- Create user role
  INSERT INTO public.user_roles (
    user_id,
    role,
    store_id,
    warehouse_id
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'store_employee')::user_role,
    (NEW.raw_user_meta_data ->> 'store_id')::uuid,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'role', 'store_employee') = 'warehouse_admin' THEN NULL
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';