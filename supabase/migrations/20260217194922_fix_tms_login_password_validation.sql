/*
  # Corrigir validação de senha no tms_login

  ## Problema
  - Senhas estão armazenadas em texto plano no banco
  - Função estava tentando comparar com SHA256
  - Precisamos aceitar ambos os formatos durante transição

  ## Solução
  - Verificar primeiro se senha está em SHA256
  - Se não, comparar texto plano
  - Manter compatibilidade com senhas antigas
*/

CREATE OR REPLACE FUNCTION public.tms_login(p_email text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user RECORD;
  v_organization RECORD;
  v_result JSONB;
  v_password_match BOOLEAN := false;
BEGIN
  -- Busca usuário
  SELECT u.*, u.organization_id, u.environment_id
  INTO v_user
  FROM users u
  WHERE u.email = p_email
    AND u.status = 'ativo'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou inativo'
    );
  END IF;

  -- Valida senha (aceita SHA256 ou texto plano)
  IF v_user.senha = encode(digest(p_password, 'sha256'), 'hex') THEN
    v_password_match := true;
  ELSIF v_user.senha = p_password THEN
    v_password_match := true;
  END IF;

  IF NOT v_password_match THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Senha incorreta'
    );
  END IF;

  -- Verifica organização ativa
  SELECT *
  INTO v_organization
  FROM organizations
  WHERE id = v_user.organization_id
    AND status = 'ativo'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organização inativa ou não encontrada'
    );
  END IF;

  -- Atualizar último login
  UPDATE users
  SET ultimo_login = now()
  WHERE id = v_user.id;

  -- Retorna sucesso com dados necessários (INCLUINDO environment_id)
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'codigo', v_user.codigo,
    'organization_id', v_user.organization_id,
    'environment_id', v_user.environment_id,
    'email', v_user.email,
    'name', v_user.nome,
    'profile', v_user.perfil,
    'establishment_id', v_user.estabelecimento_id,
    'organization', jsonb_build_object(
      'id', v_organization.id,
      'name', v_organization.name,
      'slug', v_organization.slug,
      'plan_id', v_organization.plan_id,
      'subscription_status', v_organization.subscription_status
    )
  );

  RETURN v_result;
END;
$function$;

-- Comentário
COMMENT ON FUNCTION tms_login IS 
'Autentica usuário no TMS. Aceita senhas em SHA256 ou texto plano. Retorna user_id, organization_id, environment_id.';
