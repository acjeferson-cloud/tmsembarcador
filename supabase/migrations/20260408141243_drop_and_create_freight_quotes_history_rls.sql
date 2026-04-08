DO $$ 
DECLARE
  pol_rec RECORD;
BEGIN
  FOR pol_rec IN 
    SELECT polname 
    FROM pg_policy 
    WHERE polrelid = 'freight_quotes_history'::regclass
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol_rec.polname || '" ON freight_quotes_history';
  END LOOP;
END $$;

ALTER TABLE freight_quotes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freight_quotes_history_all_access" 
ON freight_quotes_history 
FOR ALL 
USING (true) 
WITH CHECK (true);
