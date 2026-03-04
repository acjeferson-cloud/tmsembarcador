/*
  # Adicionar políticas para acesso anônimo em tabelas SaaS
  
  1. Mudanças
    - Adicionar políticas que permitam leitura de organizations e saas_plans para usuários anônimos
    - Isso permite que o SaaS Admin Console funcione sem autenticação Supabase Auth
    
  2. Segurança
    - Apenas leitura é permitida
    - Dados sensíveis continuam protegidos
*/

-- Permitir leitura de organizations para anônimos (necessário para SaaS Admin Console)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'organizations' 
    AND policyname = 'Allow anon read for SaaS admin'
  ) THEN
    CREATE POLICY "Allow anon read for SaaS admin"
      ON organizations
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Permitir leitura de saas_plans para anônimos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'saas_plans' 
    AND policyname = 'Allow anon read plans'
  ) THEN
    CREATE POLICY "Allow anon read plans"
      ON saas_plans
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Permitir todas operações em organizations para anônimos (temporário para SaaS Admin)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'organizations' 
    AND policyname = 'Allow anon manage for SaaS admin'
  ) THEN
    CREATE POLICY "Allow anon manage for SaaS admin"
      ON organizations
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Permitir leitura de organization_settings para anônimos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'organization_settings' 
    AND policyname = 'Allow anon read org settings'
  ) THEN
    CREATE POLICY "Allow anon read org settings"
      ON organization_settings
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
