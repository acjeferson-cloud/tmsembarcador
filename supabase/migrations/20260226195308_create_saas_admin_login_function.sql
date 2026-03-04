/*
  # Criar Função de Login para SaaS Admin
  
  1. Problema
    - Função saas_admin_login não existe no banco de dados
    - SaasAdminLogin.tsx tenta chamar a função e recebe erro 404
  
  2. Solução
    - Criar função saas_admin_login que valida credenciais de admin
    - Função retorna dados do admin se autenticado com sucesso
  
  3. Segurança
    - Usa SECURITY DEFINER para ter permissão de ler saas_admins
    - Valida senha usando hash
    - Atualiza last_login_at quando sucesso
*/

-- Criar função de login para SaaS Admin
CREATE OR REPLACE FUNCTION public.saas_admin_login(
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_admin RECORD;
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

  -- Retornar sucesso com dados do admin
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

-- Comentário descritivo
COMMENT ON FUNCTION public.saas_admin_login(TEXT, TEXT) IS 
  'Autentica um SaaS Admin validando email e senha hash. Retorna dados do admin se sucesso.';

-- Conceder permissão de execução para anon (login público)
GRANT EXECUTE ON FUNCTION public.saas_admin_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.saas_admin_login(TEXT, TEXT) TO authenticated;
