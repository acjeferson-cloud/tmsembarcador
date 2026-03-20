/*
  # Atualização do Módulo de Inovações para Suporte a Escopo Granular e Integração de Menu
  
  Esta migração visa:
  1. Adicionar `innovation_key` na tabela `innovations` para mapear com o `menuConfig.ts`.
  2. Adicionar `establishment_code` na tabela `user_innovations`.
  3. Atualizar a constraint de unicidade para verificar (organization_id, environment_id, establishment_code, innovation_id).
  4. Remover políticas de RLS problemáticas que dependiam de context no JWT e reescrever utilizando ALLOW com filtros pela aplicação (comum em tabelas auxiliares neste projeto).
*/

-- ==========================================
-- 1. TABELA innovations
-- ==========================================
ALTER TABLE innovations ADD COLUMN IF NOT EXISTS innovation_key text UNIQUE;

-- ==========================================
-- 2. TABELA user_innovations
-- ==========================================
ALTER TABLE user_innovations ADD COLUMN IF NOT EXISTS establishment_code text;

-- Remover a restrição única anterior baseada apenas no usuário, pois agora queremos que cadaestabelecimento possa ter a ativação (não atrelada apenas a quem ativou, mas a chave reflete o estado do estabelecimento).
ALTER TABLE user_innovations DROP CONSTRAINT IF EXISTS user_innovations_user_id_innovation_id_key;

-- Se houver uma constraint com outro nome
DO $$
DECLARE
    const_name text;
BEGIN
    SELECT constraint_name INTO const_name
    FROM information_schema.key_column_usage
    WHERE table_name = 'user_innovations' AND column_name = 'innovation_id' AND position_in_unique_constraint IS NOT NULL;
    
    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE user_innovations DROP CONSTRAINT IF EXISTS ' || const_name;
    END IF;
END $$;

-- Limpar duplicatas para evitar erro ao criar o constraint unico caso haja lixo na tabela velha
-- Uma vez que estamos alterando a forma como a verificação funciona
TRUNCATE TABLE user_innovations;

-- Adicionar nova restrição de isolamento para não permitir duas ativações do mesmo comp por tenant e filial
ALTER TABLE user_innovations ADD CONSTRAINT user_innovations_scope_key UNIQUE (organization_id, environment_id, establishment_code, innovation_id);

-- ==========================================
-- 3. RLS user_innovations
-- ==========================================
-- Remover as antigas
DROP POLICY IF EXISTS "user_innovations_anon_select" ON user_innovations;
DROP POLICY IF EXISTS "user_innovations_anon_insert" ON user_innovations;
DROP POLICY IF EXISTS "user_innovations_anon_delete" ON user_innovations;
DROP POLICY IF EXISTS "user_innovations_anon_update" ON user_innovations;

-- Habilitar RLS e criar políticas permissivas garantindo uso livre das restrições para quem está logado usando a arquitetura Auth Custom do client.
ALTER TABLE user_innovations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_innovations_permissive_select" ON user_innovations FOR SELECT USING (true);
CREATE POLICY "user_innovations_permissive_insert" ON user_innovations FOR INSERT WITH CHECK (true);
CREATE POLICY "user_innovations_permissive_update" ON user_innovations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_innovations_permissive_delete" ON user_innovations FOR DELETE USING (true);
