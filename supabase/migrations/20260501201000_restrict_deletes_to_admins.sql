-- Migration para restringir DELETE nas tabelas principais apenas para usuários com perfil 'administrador'

-- 1. Restringir exclusões de Parceiros de Negócios (Business Partners)
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON business_partners;
DROP POLICY IF EXISTS "business_partners_delete_policy" ON business_partners;

CREATE POLICY "business_partners_delete_policy"
ON business_partners FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.email = auth.jwt()->>'email'
    AND (
      users.perfil ILIKE 'administrador' 
      OR users.perfil ILIKE 'admin' 
      OR users.tipo = 'admin'
    )
  )
);

-- 2. Restringir exclusões de Tabelas de Frete (Freight Rate Tables)
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON freight_rate_tables;
DROP POLICY IF EXISTS "freight_rate_tables_delete_policy" ON freight_rate_tables;

CREATE POLICY "freight_rate_tables_delete_policy"
ON freight_rate_tables FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.email = auth.jwt()->>'email'
    AND (
      users.perfil ILIKE 'administrador' 
      OR users.perfil ILIKE 'admin' 
      OR users.tipo = 'admin'
    )
  )
);

-- 3. Restringir exclusões de Tarifas de Frete (Freight Rates)
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON freight_rates;
DROP POLICY IF EXISTS "freight_rates_delete_policy" ON freight_rates;

CREATE POLICY "freight_rates_delete_policy"
ON freight_rates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.email = auth.jwt()->>'email'
    AND (
      users.perfil ILIKE 'administrador' 
      OR users.perfil ILIKE 'admin' 
      OR users.tipo = 'admin'
    )
  )
);
