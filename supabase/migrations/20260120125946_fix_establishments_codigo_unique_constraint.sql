/*
  # Corrigir Constraint Unique do Código de Estabelecimento

  ## Problema:
  - establishments_codigo_key é UNIQUE global
  - Não permite mesmo código em environments diferentes
  - Impede criação de estabelecimentos 0001 e 0002 no Sandbox
  
  ## Solução:
  - Remover constraint global
  - Criar constraint unique composto (organization_id, environment_id, codigo)
  - Permite mesmo código em environments diferentes da mesma org
*/

-- =====================================================
-- REMOVER CONSTRAINT ANTIGO
-- =====================================================

ALTER TABLE establishments
DROP CONSTRAINT IF EXISTS establishments_codigo_key;

-- =====================================================
-- CRIAR CONSTRAINT CORRETO
-- =====================================================

-- Unique: código deve ser único dentro de organization + environment
ALTER TABLE establishments
ADD CONSTRAINT establishments_org_env_codigo_key 
UNIQUE (organization_id, environment_id, codigo);

-- Comentário explicativo
COMMENT ON CONSTRAINT establishments_org_env_codigo_key ON establishments IS 
'Garante que o código do estabelecimento é único dentro do contexto organization+environment, permitindo reuso em environments diferentes';
