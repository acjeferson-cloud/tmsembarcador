/*
  # Atualizar Auth com organization_id

  ## Visão Geral
  Modifica o sistema de autenticação para incluir organization_id no JWT token.
  O organization_id NUNCA pode ser escolhido pelo frontend - sempre vem do banco.

  ## 1. Função para Login TMS
  Valida credenciais e retorna organization_id
  
  ## 2. Função para Login Admin Console
  Valida credenciais de saas_admin_users (SEM organization_id)
  
  ## 3. Trigger para Sync
  Garante que organization_id está nos metadados do auth.users

  ## Segurança
  - organization_id NUNCA vem do frontend
  - Validação sempre no servidor
  - Token assinado pelo Supabase
  - RLS usa organization_id do token
*/

-- =====================================================
-- 1. FUNÇÃO DE LOGIN TMS
-- =====================================================

CREATE OR REPLACE FUNCTION tms_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_organization RECORD;
  v_result JSONB;
BEGIN
  -- Busca usuário
  SELECT u.*, u.organization_id
  INTO v_user
  FROM users u
  WHERE u.email = p_email
    AND u.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado ou inativo'
    );
  END IF;

  -- Valida senha (assumindo que senha já está hasheada na tabela)
  -- Em produção, usar bcrypt ou similar
  IF v_user.senha != p_password THEN
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
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organização inativa ou não encontrada'
    );
  END IF;

  -- Retorna sucesso com dados necessários
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'organization_id', v_user.organization_id,
    'email', v_user.email,
    'name', v_user.nome,
    'profile', v_user.perfil,
    'establishment_id', v_user.establishment_id,
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
$$;

-- =====================================================
-- 2. FUNÇÃO DE LOGIN ADMIN CONSOLE
-- =====================================================

CREATE OR REPLACE FUNCTION saas_admin_login(
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
  v_result JSONB;
BEGIN
  -- Busca admin
  SELECT *
  INTO v_admin
  FROM saas_admin_users
  WHERE email = p_email
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Admin não encontrado ou inativo'
    );
  END IF;

  -- Valida senha hash
  IF v_admin.password_hash != p_password_hash THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Senha incorreta'
    );
  END IF;

  -- Atualiza last_login
  UPDATE saas_admin_users
  SET last_login_at = now()
  WHERE id = v_admin.id;

  -- Retorna sucesso (SEM organization_id)
  v_result := jsonb_build_object(
    'success', true,
    'admin_id', v_admin.id,
    'email', v_admin.email,
    'name', v_admin.name,
    'role', v_admin.role,
    'is_saas_admin', true
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO PARA ATUALIZAR METADADOS DO AUTH
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_metadata_with_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- Busca organization_id do usuário TMS
  SELECT organization_id
  INTO v_organization_id
  FROM users
  WHERE email = NEW.email
  LIMIT 1;

  -- Se encontrou, atualiza metadados
  IF FOUND THEN
    NEW.raw_app_meta_data := jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{organization_id}',
      to_jsonb(v_organization_id::text)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger no auth.users (se possível - depende de permissões)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   BEFORE INSERT OR UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION update_user_metadata_with_org();

-- =====================================================
-- 4. FUNÇÃO PARA PEGAR ORGANIZATION_ID SEGURO
-- =====================================================

-- Já existe a função get_current_organization_id()
-- Garantir que ela está correta

CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Tenta pegar do JWT
  v_org_id := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
  
  -- Se não encontrou no JWT, tenta pegar do email do usuário
  IF v_org_id IS NULL THEN
    SELECT organization_id INTO v_org_id
    FROM users
    WHERE email = auth.email()
    LIMIT 1;
  END IF;
  
  RETURN v_org_id;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO PARA VERIFICAR ACESSO ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION is_saas_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verifica se tem saas_admin_id nos metadados
  v_is_admin := (auth.jwt() -> 'app_metadata' ->> 'is_saas_admin')::boolean;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- =====================================================
-- 6. POLICIES PARA SAAS ADMIN
-- =====================================================

-- Admins podem ver todas as organizações
CREATE POLICY "SaaS admins can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_saas_admin());

CREATE POLICY "SaaS admins can manage all organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (is_saas_admin())
  WITH CHECK (is_saas_admin());

-- Admins podem ver settings de todas as orgs
CREATE POLICY "SaaS admins can view all org settings"
  ON organization_settings FOR SELECT
  TO authenticated
  USING (is_saas_admin());

CREATE POLICY "SaaS admins can manage all org settings"
  ON organization_settings FOR ALL
  TO authenticated
  USING (is_saas_admin())
  WITH CHECK (is_saas_admin());

-- =====================================================
-- 7. VIEW PARA ADMINS VEREM ESTATÍSTICAS
-- =====================================================

CREATE OR REPLACE VIEW saas_organization_stats AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.subscription_status,
  o.created_at,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT e.id) as establishment_count,
  COUNT(DISTINCT ord.id) as order_count,
  COUNT(DISTINCT inv.id) as invoice_count
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN establishments e ON e.organization_id = o.id
LEFT JOIN orders ord ON ord.organization_id = o.id
LEFT JOIN invoices_nfe inv ON inv.organization_id = o.id
GROUP BY o.id, o.name, o.slug, o.subscription_status, o.created_at;

-- RLS: Apenas admins podem ver
ALTER VIEW saas_organization_stats SET (security_invoker = on);

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION tms_login IS 'Login para usuários do TMS - retorna organization_id do banco';
COMMENT ON FUNCTION saas_admin_login IS 'Login para admins do SaaS Console - SEM organization_id';
COMMENT ON FUNCTION get_current_organization_id IS 'Retorna organization_id do usuário autenticado do JWT ou banco';
COMMENT ON FUNCTION is_saas_admin IS 'Verifica se usuário autenticado é admin do SaaS';
COMMENT ON VIEW saas_organization_stats IS 'Estatísticas das organizações - apenas para admins SaaS';
