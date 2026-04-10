-- Migration: Fix Spot Negotiations Status Check Constraint
-- Description: Adds 'aguardando_fatura' to the allowed status list.

DO $$
DECLARE
    const_name text;
BEGIN
    -- Find the check constraint on the table
    SELECT constraint_name INTO const_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public' 
      AND table_name = 'freight_spot_negotiations' 
      AND constraint_type = 'CHECK';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.freight_spot_negotiations DROP CONSTRAINT ' || const_name;
    END IF;
END $$;

-- Re-create the constraint with the new status included
ALTER TABLE public.freight_spot_negotiations 
ADD CONSTRAINT freight_spot_negotiations_status_check 
CHECK (status IN ('pendente_faturamento', 'aguardando_fatura', 'liquidado', 'cancelado'));
