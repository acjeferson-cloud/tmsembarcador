/*
  # Adicionar isolamento multi-tenant às tabelas NPS

  ## Descrição
  Adiciona colunas organization_id e environment_id às tabelas relacionadas ao NPS
  para garantir isolamento completo entre tenants.

  ## Mudanças

  1. Tabelas Modificadas
    - `nps_pesquisas_cliente`: Adiciona organization_id e environment_id
    - `nps_avaliacoes_internas`: Adiciona organization_id e environment_id (se existir)
    - `nps_config`: Adiciona organization_id e environment_id (se existir)
    - `nps_historico_envios`: Adiciona organization_id e environment_id (se existir)

  2. Segurança
    - Criar políticas RLS para isolamento por organization_id e environment_id
    - Permitir INSERT/SELECT/UPDATE/DELETE apenas para dados do mesmo tenant

  ## Notas Importantes
  - Dados existentes receberão valores NULL temporariamente
  - É necessário popular esses campos com dados válidos posteriormente
*/

-- Adicionar colunas organization_id e environment_id à tabela nps_pesquisas_cliente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nps_pesquisas_cliente' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE nps_pesquisas_cliente ADD COLUMN organization_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nps_pesquisas_cliente' AND column_name = 'environment_id'
  ) THEN
    ALTER TABLE nps_pesquisas_cliente ADD COLUMN environment_id UUID;
  END IF;
END $$;

-- Adicionar índices para melhorar performance de queries filtradas
CREATE INDEX IF NOT EXISTS idx_nps_pesquisas_cliente_org_env 
  ON nps_pesquisas_cliente(organization_id, environment_id);

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_select" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_insert" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_update" ON nps_pesquisas_cliente;
DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_delete" ON nps_pesquisas_cliente;

-- Criar políticas RLS para isolamento
CREATE POLICY "nps_pesquisas_cliente_isolation_select"
  ON nps_pesquisas_cliente
  FOR SELECT
  TO anon
  USING (
    organization_id = get_session_organization_id() AND
    environment_id = get_session_environment_id()
  );

CREATE POLICY "nps_pesquisas_cliente_isolation_insert"
  ON nps_pesquisas_cliente
  FOR INSERT
  TO anon
  WITH CHECK (
    organization_id = get_session_organization_id() AND
    environment_id = get_session_environment_id()
  );

CREATE POLICY "nps_pesquisas_cliente_isolation_update"
  ON nps_pesquisas_cliente
  FOR UPDATE
  TO anon
  USING (
    organization_id = get_session_organization_id() AND
    environment_id = get_session_environment_id()
  )
  WITH CHECK (
    organization_id = get_session_organization_id() AND
    environment_id = get_session_environment_id()
  );

CREATE POLICY "nps_pesquisas_cliente_isolation_delete"
  ON nps_pesquisas_cliente
  FOR DELETE
  TO anon
  USING (
    organization_id = get_session_organization_id() AND
    environment_id = get_session_environment_id()
  );

-- Aplicar o mesmo para nps_config se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nps_config') THEN
    -- Adicionar colunas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'nps_config' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE nps_config ADD COLUMN organization_id UUID;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'nps_config' AND column_name = 'environment_id'
    ) THEN
      ALTER TABLE nps_config ADD COLUMN environment_id UUID;
    END IF;

    -- Adicionar índice
    CREATE INDEX IF NOT EXISTS idx_nps_config_org_env 
      ON nps_config(organization_id, environment_id);

    -- Habilitar RLS se não estiver
    ALTER TABLE nps_config ENABLE ROW LEVEL SECURITY;

    -- Remover políticas antigas
    DROP POLICY IF EXISTS "nps_config_isolation_select" ON nps_config;
    DROP POLICY IF EXISTS "nps_config_isolation_insert" ON nps_config;
    DROP POLICY IF EXISTS "nps_config_isolation_update" ON nps_config;
    DROP POLICY IF EXISTS "nps_config_isolation_delete" ON nps_config;

    -- Criar políticas
    CREATE POLICY "nps_config_isolation_select"
      ON nps_config FOR SELECT TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_config_isolation_insert"
      ON nps_config FOR INSERT TO anon
      WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_config_isolation_update"
      ON nps_config FOR UPDATE TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
      WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_config_isolation_delete"
      ON nps_config FOR DELETE TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
  END IF;
END $$;

-- Aplicar o mesmo para nps_avaliacoes_internas se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nps_avaliacoes_internas') THEN
    -- Adicionar colunas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'nps_avaliacoes_internas' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE nps_avaliacoes_internas ADD COLUMN organization_id UUID;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'nps_avaliacoes_internas' AND column_name = 'environment_id'
    ) THEN
      ALTER TABLE nps_avaliacoes_internas ADD COLUMN environment_id UUID;
    END IF;

    -- Adicionar índice
    CREATE INDEX IF NOT EXISTS idx_nps_avaliacoes_internas_org_env 
      ON nps_avaliacoes_internas(organization_id, environment_id);

    -- Habilitar RLS se não estiver
    ALTER TABLE nps_avaliacoes_internas ENABLE ROW LEVEL SECURITY;

    -- Remover políticas antigas
    DROP POLICY IF EXISTS "nps_avaliacoes_internas_isolation_select" ON nps_avaliacoes_internas;
    DROP POLICY IF EXISTS "nps_avaliacoes_internas_isolation_insert" ON nps_avaliacoes_internas;
    DROP POLICY IF EXISTS "nps_avaliacoes_internas_isolation_update" ON nps_avaliacoes_internas;
    DROP POLICY IF EXISTS "nps_avaliacoes_internas_isolation_delete" ON nps_avaliacoes_internas;

    -- Criar políticas
    CREATE POLICY "nps_avaliacoes_internas_isolation_select"
      ON nps_avaliacoes_internas FOR SELECT TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_avaliacoes_internas_isolation_insert"
      ON nps_avaliacoes_internas FOR INSERT TO anon
      WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_avaliacoes_internas_isolation_update"
      ON nps_avaliacoes_internas FOR UPDATE TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
      WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_avaliacoes_internas_isolation_delete"
      ON nps_avaliacoes_internas FOR DELETE TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
  END IF;
END $$;

-- Aplicar o mesmo para nps_historico_envios se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nps_historico_envios') THEN
    -- Adicionar colunas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'nps_historico_envios' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE nps_historico_envios ADD COLUMN organization_id UUID;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'nps_historico_envios' AND column_name = 'environment_id'
    ) THEN
      ALTER TABLE nps_historico_envios ADD COLUMN environment_id UUID;
    END IF;

    -- Adicionar índice
    CREATE INDEX IF NOT EXISTS idx_nps_historico_envios_org_env 
      ON nps_historico_envios(organization_id, environment_id);

    -- Habilitar RLS se não estiver
    ALTER TABLE nps_historico_envios ENABLE ROW LEVEL SECURITY;

    -- Remover políticas antigas
    DROP POLICY IF EXISTS "nps_historico_envios_isolation_select" ON nps_historico_envios;
    DROP POLICY IF EXISTS "nps_historico_envios_isolation_insert" ON nps_historico_envios;
    DROP POLICY IF EXISTS "nps_historico_envios_isolation_update" ON nps_historico_envios;
    DROP POLICY IF EXISTS "nps_historico_envios_isolation_delete" ON nps_historico_envios;

    -- Criar políticas
    CREATE POLICY "nps_historico_envios_isolation_select"
      ON nps_historico_envios FOR SELECT TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_historico_envios_isolation_insert"
      ON nps_historico_envios FOR INSERT TO anon
      WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_historico_envios_isolation_update"
      ON nps_historico_envios FOR UPDATE TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
      WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

    CREATE POLICY "nps_historico_envios_isolation_delete"
      ON nps_historico_envios FOR DELETE TO anon
      USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
  END IF;
END $$;
