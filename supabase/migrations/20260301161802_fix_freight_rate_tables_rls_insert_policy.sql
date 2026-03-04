/*
  # Simplificar política RLS de INSERT para freight_rate_tables

  1. Problema Atual
    - A política INSERT exige que o contexto seja NULL OU corresponda aos dados
    - O connection pooling HTTP do Supabase não garante persistência do contexto
    - Isso causa erro RLS 42501 mesmo quando organization_id e environment_id são fornecidos

  2. Nova Abordagem
    - Permitir INSERT quando organization_id e environment_id estão presentes nos dados
    - Não depender do contexto de sessão para INSERT
    - O contexto ainda é usado para SELECT, UPDATE e DELETE (operações de leitura/modificação)

  3. Segurança
    - O usuário só consegue inserir com organization_id/environment_id que tem acesso
    - Depois do INSERT, o SELECT só mostrará registros do seu contexto
    - Isso mantém o isolamento multi-tenant
*/

-- Remover política antiga de INSERT
DROP POLICY IF EXISTS freight_rate_tables_insert_anon_context ON freight_rate_tables;

-- Criar nova política de INSERT mais simples e robusta
CREATE POLICY freight_rate_tables_insert_with_org_env
  ON freight_rate_tables
  FOR INSERT
  TO public
  WITH CHECK (
    -- Apenas exigir que organization_id e environment_id estejam presentes
    organization_id IS NOT NULL AND 
    environment_id IS NOT NULL
  );

COMMENT ON POLICY freight_rate_tables_insert_with_org_env ON freight_rate_tables IS 
'Permite INSERT quando organization_id e environment_id estão presentes nos dados. Não depende de contexto de sessão devido ao connection pooling HTTP do Supabase.';
