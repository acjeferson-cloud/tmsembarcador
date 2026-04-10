-- Migration: Spot Sequence Trigger
-- Description: Adds a multi-tenant isolated auto-increment code generation layer for Spot Negotiations

DO $$
BEGIN
    ALTER TABLE public.freight_spot_negotiations ADD COLUMN code TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE OR REPLACE FUNCTION generate_spot_negotiation_code()
RETURNS trigger AS $$
DECLARE
  next_val numeric;
  max_val numeric;
BEGIN
  -- Se o codigo for inserido manualmente pela UI, evita gerar
  IF NEW.code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Extracts digits from the 'code', casts to numeric, finds max inside the tenant+establishment partition
  SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '\D', '', 'g'), '')::numeric), 0)
  INTO max_val
  FROM public.freight_spot_negotiations
  WHERE organization_id = NEW.organization_id
    AND environment_id = NEW.environment_id
    AND establishment_id = NEW.establishment_id;
    
  next_val := max_val + 1;
  NEW.code := LPAD(next_val::text, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_spot_negotiation_code ON public.freight_spot_negotiations;
CREATE TRIGGER trigger_generate_spot_negotiation_code
BEFORE INSERT ON public.freight_spot_negotiations
FOR EACH ROW
EXECUTE FUNCTION generate_spot_negotiation_code();

-- Update any existing Spot Negotiations to have a valid code so UI doesn't crash
DO $$
DECLARE
  rec RECORD;
  next_val INT;
BEGIN
  FOR rec IN (SELECT id, organization_id, environment_id, establishment_id FROM public.freight_spot_negotiations WHERE code IS NULL ORDER BY created_at ASC) LOOP
    SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '\D', '', 'g'), '')::numeric), 0) + 1
    INTO next_val
    FROM public.freight_spot_negotiations
    WHERE organization_id = rec.organization_id
      AND environment_id = rec.environment_id
      AND establishment_id = rec.establishment_id;

    UPDATE public.freight_spot_negotiations
    SET code = LPAD(next_val::text, 5, '0')
    WHERE id = rec.id;
  END LOOP;
END $$;
