/*
  # Simplificar política RLS de INSERT para freight_rates

  1. Problema
    - Mesma questão da tabela freight_rate_tables
    - Política exige contexto OU correspondência, mas connection pooling não garante persistência

  2. Solução
    - Permitir INSERT quando organization_id e environment_id estão presentes
    - Não depender de contexto de sessão para INSERT
*/

-- Remover política antiga
DROP POLICY IF EXISTS freight_rates_insert_anon_context ON freight_rates;

-- Criar nova política simplificada
CREATE POLICY freight_rates_insert_with_org_env
  ON freight_rates
  FOR INSERT
  TO public
  WITH CHECK (
    organization_id IS NOT NULL AND 
    environment_id IS NOT NULL
  );

COMMENT ON POLICY freight_rates_insert_with_org_env ON freight_rates IS 
'Permite INSERT quando organization_id e environment_id estão presentes nos dados.';
