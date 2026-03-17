-- 1. Create a sequence for pickup numbers starting at 1
CREATE SEQUENCE IF NOT EXISTS pickups_numero_seq START 1;

-- 2. Alter the default value of numero_coleta to use the sequence and format it
ALTER TABLE public.pickups 
  ALTER COLUMN numero_coleta SET DEFAULT ('COL-' || LPAD(nextval('pickups_numero_seq')::text, 4, '0'));

-- 3. Reset the sequence if any old test data exists to ensure we start at max+1 (optional, but good practice if starting fresh)
SELECT setval('pickups_numero_seq', COALESCE((SELECT MAX(NULLIF(regexp_replace(numero_coleta, '\D', '', 'g'), '')::integer) FROM public.pickups), 1), true);
