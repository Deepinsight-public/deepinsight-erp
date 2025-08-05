-- Drop existing enum and recreate with new values
DROP TYPE IF EXISTS public.user_role CASCADE;

CREATE TYPE public.user_role AS ENUM (
  'hq_admin',
  'warehouse_admin', 
  'store_manager',
  'store_staff'
);

-- Update existing profiles table to use the new enum
ALTER TABLE public.profiles 
ADD COLUMN new_role public.user_role NOT NULL DEFAULT 'store_staff';

-- Copy data from old role column if it exists
UPDATE public.profiles 
SET new_role = CASE 
  WHEN role::text = 'store_manager' THEN 'store_manager'::public.user_role
  ELSE 'store_staff'::public.user_role
END;

-- Drop old role column and rename new one
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles RENAME COLUMN new_role TO role;

-- Create user_roles bridging table for multiple roles support
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  warehouse_id UUID, -- Future warehouse support
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_store_id ON public.user_roles(store_id);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles during signup" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid uuid)
RETURNS TABLE(role public.user_role, store_id uuid, warehouse_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ur.role, ur.store_id, ur.warehouse_id
  FROM public.user_roles ur
  WHERE ur.user_id = user_uuid;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, check_role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = user_uuid AND ur.role = check_role
  );
$$;

-- Update trigger for timestamps
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();