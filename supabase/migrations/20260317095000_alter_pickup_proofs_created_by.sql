-- Alter pickup_proofs table to change created_by from uuid to integer
-- Drop the column and recreate since no existing data depends on the uuid
ALTER TABLE public.pickup_proofs DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.pickup_proofs ADD COLUMN created_by integer;
