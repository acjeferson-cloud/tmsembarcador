/*
  # Corrigir validate_user_credentials para aceitar SHA-256

  1. Problema
    - Função valida apenas bcrypt ($2*) e texto plano
    - Não valida senhas em SHA-256 (64 caracteres hex)
  
  2. Solução
    - Dropar função existente
    - Recriar com suporte a SHA-256
*/

-- Dropar função existente
DROP FUNCTION IF EXISTS validate_user_credentials(text, text, text, text);

-- Recriar função com suporte a SHA-256
CREATE FUNCTION validate_user_credentials(
  p_email text,
  p_password text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  message text,
  user_data jsonb,
  login_attempts integer
) AS $$
DECLARE
  v_user_record RECORD;
  v_password_matches boolean := false;
  v_estabelecimentos_permitidos jsonb;
  v_user_id integer;
  v_password_hash text;
BEGIN
  -- BYPASS RLS: Buscar usuário diretamente
  EXECUTE format('
    SELECT 
      id,
      codigo,
      nome,
      email,
      senha,
      perfil,
      permissoes,
      status,
      telefone,
      celular,
      cargo,
      departamento,
      tentativas_login,
      estabelecimento_id,
      estabelecimentos_permitidos,
      foto_perfil_url,
      organization_id,
      environment_id
    FROM users
    WHERE email = %L
    LIMIT 1
  ', p_email)
  INTO v_user_record;

  -- Verificar se usuário existe
  IF v_user_record.id IS NULL THEN
    RETURN QUERY SELECT 
      false,
      'Credenciais inválidas. Tente novamente.'::text,
      NULL::jsonb,
      0;
    RETURN;
  END IF;

  -- Verificar se usuário está inativo
  IF v_user_record.status != 'ativo' THEN
    RETURN QUERY SELECT 
      false,
      'Usuário inativo. Contate o administrador.'::text,
      NULL::jsonb,
      0;
    RETURN;
  END IF;

  -- Verificar se usuário está bloqueado
  IF v_user_record.tentativas_login >= 5 THEN
    RETURN QUERY SELECT 
      false,
      'Usuário bloqueado por múltiplas tentativas de login. Contate o administrador.'::text,
      NULL::jsonb,
      v_user_record.tentativas_login;
    RETURN;
  END IF;

  -- Validar senha
  IF v_user_record.senha IS NOT NULL THEN
    IF v_user_record.senha LIKE '$2%' THEN
      -- Bcrypt hash
      v_password_matches := (v_user_record.senha = crypt(p_password, v_user_record.senha));
    ELSIF LENGTH(v_user_record.senha) = 64 AND v_user_record.senha ~ '^[a-f0-9]+$' THEN
      -- SHA-256 hash (64 caracteres hexadecimais)
      v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
      v_password_matches := (v_user_record.senha = v_password_hash);
    ELSE
      -- Texto plano (fallback para compatibilidade)
      v_password_matches := (v_user_record.senha = p_password);
    END IF;
  END IF;

  -- Preparar estabelecimentos_permitidos
  IF v_user_record.estabelecimentos_permitidos IS NOT NULL THEN
    v_estabelecimentos_permitidos := to_jsonb(v_user_record.estabelecimentos_permitidos);
  ELSE
    v_estabelecimentos_permitidos := '[]'::jsonb;
  END IF;

  IF v_password_matches THEN
    -- Login bem-sucedido

    -- Atualizar ultimo_login usando EXECUTE para bypass RLS
    EXECUTE format('
      UPDATE users
      SET 
        ultimo_login = now(),
        tentativas_login = 0
      WHERE email = %L
    ', p_email);

    -- Gerar ID numérico a partir do hash do UUID
    v_user_id := ('x' || substr(v_user_record.id::text, 1, 8))::bit(32)::int;

    -- Retornar sucesso com dados do usuário
    RETURN QUERY SELECT 
      true,
      'Login realizado com sucesso'::text,
      jsonb_build_object(
        'id', v_user_id,
        'codigo', v_user_record.codigo,
        'email', v_user_record.email,
        'nome', v_user_record.nome,
        'perfil', v_user_record.perfil,
        'telefone', COALESCE(v_user_record.telefone, ''),
        'celular', COALESCE(v_user_record.celular, ''),
        'cargo', COALESCE(v_user_record.cargo, ''),
        'departamento', COALESCE(v_user_record.departamento, ''),
        'status', v_user_record.status,
        'foto_perfil', v_user_record.foto_perfil_url,
        'estabelecimentos_permitidos', v_estabelecimentos_permitidos,
        'permissoes', COALESCE(v_user_record.permissoes, '["all"]'::jsonb),
        'organization_id', v_user_record.organization_id::text,
        'environment_id', v_user_record.environment_id::text
      ),
      0;
  ELSE
    -- Senha incorreta
    EXECUTE format('
      UPDATE users
      SET tentativas_login = COALESCE(tentativas_login, 0) + 1
      WHERE email = %L
    ', p_email);

    RETURN QUERY SELECT 
      false,
      'Credenciais inválidas. Tente novamente.'::text,
      NULL::jsonb,
      COALESCE(v_user_record.tentativas_login, 0) + 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_user_credentials IS
  'Valida credenciais de usuário. Suporta bcrypt ($2*), SHA-256 (64 hex) e texto plano.';
