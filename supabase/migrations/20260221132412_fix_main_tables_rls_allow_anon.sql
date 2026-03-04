/*
  # Corrigir RLS das Tabelas Principais para Permitir Acesso Anônimo
  
  Aplicar apenas nas tabelas que EXISTEM
*/

-- Business Partners
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_partners') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read business_partners in their org/env" ON business_partners';
    EXECUTE 'CREATE POLICY "Allow access business_partners for anon" ON business_partners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Orders
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read orders in their org/env" ON orders';
    EXECUTE 'CREATE POLICY "Allow access orders for anon" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Establishments
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'establishments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read establishments in their org/env" ON establishments';
    EXECUTE 'CREATE POLICY "Allow access establishments for anon" ON establishments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Users
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read users in their org/env" ON users';
    EXECUTE 'CREATE POLICY "Allow access users for anon" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Occurrences
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'occurrences') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read occurrences in their org/env" ON occurrences';
    EXECUTE 'CREATE POLICY "Allow access occurrences for anon" ON occurrences FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Rejection Reasons
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rejection_reasons') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read rejection_reasons in their org/env" ON rejection_reasons';
    EXECUTE 'CREATE POLICY "Allow access rejection_reasons for anon" ON rejection_reasons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Freight Rates
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'freight_rates') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read freight_rates in their org/env" ON freight_rates';
    EXECUTE 'CREATE POLICY "Allow access freight_rates for anon" ON freight_rates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;
