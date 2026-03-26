-- Migração para Suporte Correto a Usuários Multi-Ambiente (Multi-Tenancy)

-- 1. Relaxar a constraint de e-mail para permitir o mesmo e-mail em diferentes ambientes
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_environment_id_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_env_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

ALTER TABLE users ADD CONSTRAINT users_email_env_key UNIQUE (email, environment_id);

-- 2. Criar RPC que a UI do SaaS Admin usará para clonar o próprio usuário para um novo ambiente
CREATE OR REPLACE FUNCTION link_saas_admin_to_environment(
  p_user_email text,
  p_target_environment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source_user record;
  v_new_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Procurar o usuário original (no primeiro ambiente onde ele existir)
  SELECT * INTO v_source_user 
  FROM users 
  WHERE email = p_user_email 
  ORDER BY created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário de origem não encontrado.');
  END IF;

  -- Obter a org_id do ambiente de destino para consistência
  SELECT organization_id INTO v_org_id 
  FROM saas_environments 
  WHERE id = p_target_environment_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ambiente de destino não encontrado.');
  END IF;

  -- Verificar se já está vinculado naquele ambiente específico
  IF EXISTS (SELECT 1 FROM users WHERE email = p_user_email AND environment_id = p_target_environment_id) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Usuário já está vinculado a este ambiente.');
  END IF;

  -- Inserir o clone do administrador Master no novo ambiente
  INSERT INTO users (
    codigo, nome, email, senha_hash, cpf, telefone, celular, 
    cargo, departamento, data_admissao, data_nascimento, endereco, 
    bairro, cep, cidade, estado, perfil, permissoes, 
    ativo, bloqueado, estabelecimento_id, estabelecimentos_permitidos,
    foto_perfil_url, preferred_language, metadata, created_by,
    organization_id, environment_id
  ) VALUES (
    v_source_user.codigo, v_source_user.nome, v_source_user.email, v_source_user.senha_hash, v_source_user.cpf, v_source_user.telefone, v_source_user.celular,
    v_source_user.cargo, v_source_user.departamento, v_source_user.data_admissao, v_source_user.data_nascimento, v_source_user.endereco,
    v_source_user.bairro, v_source_user.cep, v_source_user.cidade, v_source_user.estado, v_source_user.perfil, v_source_user.permissoes,
    true, false, null, '[]'::jsonb,
    v_source_user.foto_perfil_url, v_source_user.preferred_language, v_source_user.metadata, v_source_user.created_by,
    v_org_id, p_target_environment_id
  ) RETURNING id INTO v_new_user_id;

  RETURN jsonb_build_object('success', true, 'new_user_id', v_new_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION link_saas_admin_to_environment(text, uuid) TO authenticated;
