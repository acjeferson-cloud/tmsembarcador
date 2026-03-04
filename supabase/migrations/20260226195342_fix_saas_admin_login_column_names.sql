/*
  # Corrigir Função saas_admin_login com Nomes Corretos das Colunas
  
  1. Problema
    - Função estava usando nomes de colunas em inglês (name, password_hash, role, is_active)
    - Tabela saas_admins tem colunas em português (nome, senha_hash, ativo)
    - Tabela não tem coluna 'role'
  
  2. Solução
    - Atualizar função para usar nomes corretos das colunas
    - Remover referência à coluna 'role' que não existe
*/

-- Recriar função com nomes corretos das colunas
CREATE OR REPLACE FUNCTION public.saas_admin_login(
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_admin RECORD;
BEGIN
  -- Buscar admin na tabela saas_admins (usando nomes corretos das colunas)
  SELECT id, email, nome, senha_hash, ativo, last_login
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
  IF NOT v_admin.ativo THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta de administrador desativada'
    );
  END IF;

  -- Verificar senha (comparar hash)
  IF v_admin.senha_hash != p_password_hash THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Administrador não encontrado ou credenciais inválidas'
    );
  END IF;

  -- Atualizar último login
  UPDATE saas_admins
  SET last_login = NOW()
  WHERE id = v_admin.id;

  -- Retornar sucesso com dados do admin
  RETURN jsonb_build_object(
    'success', true,
    'admin_id', v_admin.id,
    'email', v_admin.email,
    'name', v_admin.nome,
    'is_saas_admin', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário descritivo
COMMENT ON FUNCTION public.saas_admin_login(TEXT, TEXT) IS 
  'Autentica um SaaS Admin validando email e senha hash. Retorna dados do admin se sucesso.';
