/*
  # Atualizar SaaS Admin Login para configurar metadata

  1. Problema
    - saas_admin_login não estava configurando is_saas_admin no auth.users metadata
    - Frontend tenta atualizar via supabase.auth.updateUser mas pode não persistir
  
  2. Solução
    - Atualizar função saas_admin_login para setar is_saas_admin no raw_app_meta_data
    - Garantir que o metadata seja persistido no banco

  3. Nota
    - raw_app_meta_data só pode ser modificado via funções SECURITY DEFINER
    - Por isso é feito na função de login
*/

-- Atualizar função saas_admin_login
CREATE OR REPLACE FUNCTION saas_admin_login(
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_admin RECORD;
  v_auth_user_id UUID;
BEGIN
  -- Buscar admin na tabela saas_admins
  SELECT id, email, name, password_hash, role, is_active, last_login_at
  INTO v_admin
  FROM saas_admins
  WHERE email = p_email;

  -- Verificar se admin existe
  IF v_admin.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Administrador não encontrado ou credenciais inválidas'
    );
  END IF;

  -- Verificar se está ativo
  IF NOT v_admin.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta de administrador desativada'
    );
  END IF;

  -- Verificar senha
  IF v_admin.password_hash != p_password_hash THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Administrador não encontrado ou credenciais inválidas'
    );
  END IF;

  -- Atualizar último login
  UPDATE saas_admins
  SET last_login_at = NOW()
  WHERE id = v_admin.id;

  -- Buscar o ID do usuário autenticado atual (se houver)
  v_auth_user_id := auth.uid();

  -- Se houver usuário autenticado, atualizar seu metadata
  IF v_auth_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
      'is_saas_admin', true,
      'saas_admin_id', v_admin.id,
      'saas_admin_role', v_admin.role,
      'saas_admin_email', v_admin.email
    )
    WHERE id = v_auth_user_id;
  END IF;

  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'admin_id', v_admin.id,
    'email', v_admin.email,
    'name', v_admin.name,
    'role', v_admin.role,
    'is_saas_admin', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION saas_admin_login(TEXT, TEXT) IS 
  'Autentica um SaaS Admin e configura seu metadata no auth.users incluindo is_saas_admin=true';
