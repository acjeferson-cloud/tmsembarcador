/*
  # Corrigir RPC de Login - Códigos Alfanuméricos

  ## Problema:
  - Função RPC tenta converter codigo::integer
  - Usuários multi-tenant têm códigos alfanuméricos (ADM-CLI1, ADM-CLI2)
  - Conversão falha: "invalid input syntax for type integer: 'ADM-CLI1'"

  ## Solução:
  - Usar um hash do UUID como ID numérico
  - Ou usar um ID sequencial
  - Manter codigo como string
*/

CREATE OR REPLACE FUNCTION validate_user_credentials(
  p_email text,
  p_password text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  message text,
  user_data jsonb,
  failed_attempts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_password_matches boolean := false;
  v_estabelecimentos_permitidos jsonb;
  v_user_id integer;
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
    ELSE
      -- Texto plano
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
    -- Usar os primeiros 8 caracteres do UUID convertidos para int
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
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION validate_user_credentials(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_user_credentials(text, text, text, text) TO authenticated;
