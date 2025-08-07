-- Add kw_code column to products table
ALTER TABLE public.products 
ADD COLUMN kw_code character varying;