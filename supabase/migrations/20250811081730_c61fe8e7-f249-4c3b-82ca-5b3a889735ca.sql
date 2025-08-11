BEGIN;
-- 1) Add optional first/last name columns to customers and profiles
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_name text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- 2) Backfill existing data by splitting name/full_name
UPDATE public.customers
SET
  first_name = COALESCE(first_name,
                        CASE WHEN name IS NOT NULL AND btrim(name) <> '' THEN split_part(name, ' ', 1) ELSE NULL END),
  last_name = COALESCE(last_name,
                       CASE 
                         WHEN name IS NULL OR btrim(name) = '' THEN NULL
                         WHEN position(' ' in name) = 0 THEN NULL
                         ELSE btrim(substr(name, position(' ' in name) + 1))
                       END)
WHERE (first_name IS NULL OR last_name IS NULL);

UPDATE public.profiles
SET
  first_name = COALESCE(first_name,
                        CASE WHEN full_name IS NOT NULL AND btrim(full_name) <> '' THEN split_part(full_name, ' ', 1) ELSE NULL END),
  last_name = COALESCE(last_name,
                       CASE 
                         WHEN full_name IS NULL OR btrim(full_name) = '' THEN NULL
                         WHEN position(' ' in full_name) = 0 THEN NULL
                         ELSE btrim(substr(full_name, position(' ' in full_name) + 1))
                       END)
WHERE (first_name IS NULL OR last_name IS NULL);

-- 3) Create triggers to keep name and first/last in sync for customers
CREATE OR REPLACE FUNCTION public.sync_customer_name_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If first/last provided but name missing, build name
  IF (COALESCE(NEW.name, '') = '') AND (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
    NEW.name := btrim(concat_ws(' ', NEW.first_name, NEW.last_name));
  END IF;

  -- If name provided but first/last missing, split name
  IF (NEW.name IS NOT NULL AND (NEW.first_name IS NULL AND NEW.last_name IS NULL)) THEN
    NEW.first_name := split_part(NEW.name, ' ', 1);
    IF position(' ' in NEW.name) = 0 THEN
      NEW.last_name := NULL;
    ELSE
      NEW.last_name := btrim(substr(NEW.name, position(' ' in NEW.name) + 1));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_customer_name_fields ON public.customers;
CREATE TRIGGER trg_sync_customer_name_fields
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_name_fields();

-- 4) Create triggers to keep full_name and first/last in sync for profiles
CREATE OR REPLACE FUNCTION public.sync_profile_name_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If first/last provided but full_name missing, build full_name
  IF (COALESCE(NEW.full_name, '') = '') AND (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
    NEW.full_name := btrim(concat_ws(' ', NEW.first_name, NEW.last_name));
  END IF;

  -- If full_name provided but first/last missing, split full_name
  IF (NEW.full_name IS NOT NULL AND (NEW.first_name IS NULL AND NEW.last_name IS NULL)) THEN
    NEW.first_name := split_part(NEW.full_name, ' ', 1);
    IF position(' ' in NEW.full_name) = 0 THEN
      NEW.last_name := NULL;
    ELSE
      NEW.last_name := btrim(substr(NEW.full_name, position(' ' in NEW.full_name) + 1));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_name_fields ON public.profiles;
CREATE TRIGGER trg_sync_profile_name_fields
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_name_fields();

COMMIT;