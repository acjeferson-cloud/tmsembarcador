/*
  # Funções de Autenticação e Autorização

  1. Funções Criadas
    - `validate_user_credentials` - Valida credenciais do usuário
    - `check_user_blocked` - Verifica se usuário está bloqueado
    - `increment_login_attempts` - Incrementa tentativas de login
    - `reset_login_attempts` - Reseta tentativas de login
    - `get_user_organizations_environments` - Retorna orgs e envs do usuário
    - `get_user_establishments` - Retorna estabelecimentos do usuário
*/

-- Função para validar credenciais do usuário
CREATE OR REPLACE FUNCTION validate_user_credentials(
  p_email text,
  p_senha text
)
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  environment_id uuid,
  nome text,
  tipo text,
  bloqueado boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.organization_id,
    u.environment_id,
    u.nome,
    u.tipo,
    u.bloqueado
  FROM users u
  WHERE u.email = p_email
    AND u.senha_hash = encode(digest(p_senha, 'sha256'), 'hex')
    AND u.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION check_user_blocked(
  p_email text
)
RETURNS boolean AS $$
DECLARE
  v_bloqueado boolean;
  v_tentativas integer;
BEGIN
  SELECT bloqueado, tentativas_login
  INTO v_bloqueado, v_tentativas
  FROM users
  WHERE email = p_email;
  
  -- Se usuário não existe, retorna false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Bloqueia automaticamente após 5 tentativas
  IF v_tentativas >= 5 AND NOT v_bloqueado THEN
    UPDATE users
    SET bloqueado = true
    WHERE email = p_email;
    RETURN true;
  END IF;
  
  RETURN v_bloqueado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar tentativas de login
CREATE OR REPLACE FUNCTION increment_login_attempts(
  p_email text
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET tentativas_login = tentativas_login + 1,
      updated_at = now()
  WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para resetar tentativas de login
CREATE OR REPLACE FUNCTION reset_login_attempts(
  p_email text,
  p_ip text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET tentativas_login = 0,
      ultimo_login = now(),
      ultimo_ip = COALESCE(p_ip, ultimo_ip),
      updated_at = now()
  WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para retornar organizações e ambientes do usuário
CREATE OR REPLACE FUNCTION get_user_organizations_environments(
  p_email text
)
RETURNS TABLE (
  organization_id uuid,
  organization_codigo text,
  organization_nome text,
  environment_id uuid,
  environment_codigo text,
  environment_nome text,
  environment_tipo text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    o.id,
    o.codigo,
    o.nome,
    e.id,
    e.codigo,
    e.nome,
    e.tipo
  FROM users u
  JOIN saas_organizations o ON o.id = u.organization_id
  JOIN saas_environments e ON e.id = u.environment_id
  WHERE u.email = p_email
    AND u.ativo = true
    AND o.status = 'ativo'
    AND e.status = 'ativo'
  ORDER BY o.nome, e.tipo, e.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para retornar estabelecimentos do usuário
CREATE OR REPLACE FUNCTION get_user_establishments(
  p_user_id uuid,
  p_organization_id uuid,
  p_environment_id uuid
)
RETURNS TABLE (
  establishment_id uuid,
  codigo text,
  nome_fantasia text,
  is_default boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.codigo,
    e.nome_fantasia,
    COALESCE(ue.is_default, false) as is_default
  FROM establishments e
  LEFT JOIN user_establishments ue ON ue.establishment_id = e.id AND ue.user_id = p_user_id
  WHERE e.organization_id = p_organization_id
    AND e.environment_id = p_environment_id
    AND e.ativo = true
  ORDER BY is_default DESC, e.codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;