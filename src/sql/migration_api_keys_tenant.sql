-- MIGRATION: Adicionar Contexto Multi-Tenant para tabelas filhas de API Keys
-- Execute este script no painel SQL do seu Supabase para reforçar a segurança e padronização.

-- 1. Tabela de Histórico de Rotações
ALTER TABLE public.api_keys_rotation_history 
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS environment_id UUID,
  ADD COLUMN IF NOT EXISTS establishment_id UUID;

-- 2. Tabela de Logs de Uso
ALTER TABLE public.api_keys_usage_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS environment_id UUID,
  ADD COLUMN IF NOT EXISTS establishment_id UUID;

-- 3. Tabela Base ou Antiga de API Keys (se ainda estiver em uso)
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS environment_id UUID,
  ADD COLUMN IF NOT EXISTS establishment_id UUID;

-- =========================================================================
-- TRIGGER UPDATE: Atualizar função que incrementa os logs para repassar os tenants!
-- Se você possui a RPC `increment_api_key_usage`, ela deve ser atualizada para buscar os IDs pais:
-- =========================================================================
CREATE OR REPLACE FUNCTION increment_api_key_usage(key_id UUID, increment_amount INT DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_env_id UUID;
  v_est_id UUID;
BEGIN
  -- 1. Coletar o contexto institucional atual da Chave Configurada
  SELECT organization_id, environment_id, estabelecimento_id 
    INTO v_org_id, v_env_id, v_est_id
  FROM public.api_keys_config
  WHERE id = key_id;

  -- 2. Atualizar o uso acumulado na tabela pai
  UPDATE public.api_keys_config
  SET current_usage = current_usage + increment_amount,
      last_used_at = NOW()
  WHERE id = key_id;

  -- 3. Gravar o log com a herança contextual ativada!
  INSERT INTO public.api_keys_usage_logs (
    key_config_id, usage_amount, organization_id, environment_id, establishment_id
  ) VALUES (
    key_id, increment_amount, v_org_id, v_env_id, v_est_id
  );
END;
$$;

-- =========================================================================
-- TRIGGER UPDATE: Atualizar a trigger de rotação para repassar os tenants!
-- Se você possui uma trigger que alimenta 'api_keys_rotation_history' no UPDATE da config,
-- o código dela deve ser ajustado para algo como:
-- =========================================================================
CREATE OR REPLACE FUNCTION log_api_key_rotation()
RETURNS trigger AS $$
BEGIN
  IF NEW.api_key <> OLD.api_key THEN
    INSERT INTO public.api_keys_rotation_history (
      key_config_id, old_key_hash, new_key_hash, rotated_by, rotated_at,
      organization_id, environment_id, establishment_id
    ) VALUES (
      OLD.id, OLD.api_key, NEW.api_key, NEW.rotated_by, NEW.rotated_at,
      OLD.organization_id, OLD.environment_id, OLD.estabelecimento_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
