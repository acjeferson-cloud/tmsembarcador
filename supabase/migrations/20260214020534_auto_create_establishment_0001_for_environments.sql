/*
  # Auto-criar Estabelecimento 0001 para Environments
  
  1. Problema
    - Environments sem estabelecimentos não podem ser acessados
    - Admin global precisa ter acesso a todos os estabelecimentos
  
  2. Solução
    - Criar estabelecimento "0001" para environments que não têm estabelecimentos
    - Criar trigger que automaticamente cria estabelecimento "0001" quando novo environment é criado
    - Admin global tem acesso implícito (via bypass em get_user_establishments)
  
  3. Estabelecimentos Criados
    - Quimidrol Homologação: 0001 (temporário)
  
  4. Trigger para Novos Environments
    - Automaticamente cria estabelecimento 0001
    - Dados temporários que podem ser editados depois
*/

-- 1. Criar estabelecimentos "0001" para environments sem estabelecimentos

-- Quimidrol - Homologação
INSERT INTO establishments (
  codigo,
  cnpj,
  inscricao_estadual,
  razao_social,
  fantasia,
  endereco,
  bairro,
  cep,
  cidade,
  estado,
  tipo,
  tracking_prefix,
  organization_id,
  environment_id
)
SELECT
  '0001',
  '00.000.000/0001-00',
  'ISENTO',
  o.name || ' - Estabelecimento Padrão',
  o.name || ' - Padrão',
  'Endereço Temporário',
  'Centro',
  '00000-000',
  'São Paulo',
  'SP',
  'matriz',
  'TMP',
  e.organization_id,
  e.id
FROM environments e
JOIN organizations o ON e.organization_id = o.id
WHERE e.id = 'dfd414bd-8d08-4a4d-81e5-c59f51c7863a' -- Quimidrol Homologação
  AND NOT EXISTS (
    SELECT 1 FROM establishments est 
    WHERE est.environment_id = e.id
  );

-- 2. Criar função para criar estabelecimento padrão automaticamente

CREATE OR REPLACE FUNCTION create_default_establishment_for_environment()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_name text;
BEGIN
  -- Buscar nome da organização
  SELECT name INTO v_organization_name
  FROM organizations
  WHERE id = NEW.organization_id;
  
  -- Criar estabelecimento padrão 0001
  INSERT INTO establishments (
    codigo,
    cnpj,
    inscricao_estadual,
    razao_social,
    fantasia,
    endereco,
    bairro,
    cep,
    cidade,
    estado,
    tipo,
    tracking_prefix,
    organization_id,
    environment_id
  ) VALUES (
    '0001',
    '00.000.000/0001-00',
    'ISENTO',
    v_organization_name || ' - Estabelecimento Padrão',
    v_organization_name || ' - Padrão',
    'Endereço Temporário',
    'Centro',
    '00000-000',
    'São Paulo',
    'SP',
    'matriz',
    'TMP',
    NEW.organization_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger para novos environments

DROP TRIGGER IF EXISTS trigger_create_default_establishment ON environments;

CREATE TRIGGER trigger_create_default_establishment
  AFTER INSERT ON environments
  FOR EACH ROW
  EXECUTE FUNCTION create_default_establishment_for_environment();

COMMENT ON FUNCTION create_default_establishment_for_environment IS
  'Cria automaticamente estabelecimento 0001 quando novo environment é criado';

COMMENT ON TRIGGER trigger_create_default_establishment ON environments IS
  'Garante que todo environment tenha pelo menos um estabelecimento 0001';

-- 4. Verificar resultado
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM environments e
  LEFT JOIN establishments est ON est.environment_id = e.id
  WHERE est.id IS NULL;
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Ainda existem % environment(s) sem estabelecimentos!', v_count;
  END IF;
  
  RAISE NOTICE 'Sucesso: Todos os environments têm estabelecimentos!';
END $$;
