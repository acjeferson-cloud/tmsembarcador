/*
  # Limpeza de Organizações Obsoletas
  
  1. Remove Dados
    - Deleta ambientes das organizações DEMO001 e DEMOLOG
    - Deleta organizações DEMO001 e DEMOLOG
    
  2. Organizações Mantidas
    - 00000001 - Demonstração
    - 00000002 - Quimidrol
    - 00000003 - Lynus
    - 00000004 - GMEG
    
  3. Validação
    - Após limpeza, devem restar exatamente 4 organizações
    - Próximo código será 00000005
*/

-- Deletar ambientes das organizações obsoletas (CASCADE através de FK)
DELETE FROM saas_environments 
WHERE organization_id IN (
  SELECT id FROM saas_organizations 
  WHERE codigo IN ('DEMO001', 'DEMOLOG')
);

-- Deletar organizações obsoletas
DELETE FROM saas_organizations 
WHERE codigo IN ('DEMO001', 'DEMOLOG');

-- Validar que restaram exatamente 4 organizações
DO $$
DECLARE
  org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM saas_organizations;
  
  IF org_count != 4 THEN
    RAISE EXCEPTION 'Erro na limpeza: esperado 4 organizações, encontrado %', org_count;
  END IF;
  
  RAISE NOTICE 'Limpeza concluída com sucesso. Total de organizações: %', org_count;
END $$;

-- Comentário de auditoria
COMMENT ON TABLE saas_organizations IS 'Tabela de organizações SaaS - Organizações DEMO001 e DEMOLOG removidas em 2026-03-01';
