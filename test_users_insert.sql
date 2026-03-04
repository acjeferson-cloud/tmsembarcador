-- Script para testar inserção de 14 usuários na organização 00000001 ambiente PRODUÇÃO

DO $$
DECLARE
  v_org_id uuid;
  v_env_id uuid;
  v_estabelecimento_id uuid;
  i integer;
BEGIN
  -- Buscar IDs da organização e environment
  SELECT id INTO v_org_id FROM saas_organizations WHERE codigo = '00000001';
  SELECT id INTO v_env_id FROM saas_environments WHERE codigo = 'PRODUCAO' AND organization_id = v_org_id;
  SELECT id INTO v_estabelecimento_id FROM establishments WHERE codigo = '0001' AND organization_id = v_org_id AND environment_id = v_env_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organização 00000001 não encontrada';
  END IF;

  IF v_env_id IS NULL THEN
    RAISE EXCEPTION 'Environment PRODUÇÃO não encontrado';
  END IF;

  IF v_estabelecimento_id IS NULL THEN
    RAISE EXCEPTION 'Estabelecimento 0001 não encontrado';
  END IF;

  RAISE NOTICE 'Org ID: %, Env ID: %, Estab ID: %', v_org_id, v_env_id, v_estabelecimento_id;

  -- Inserir 14 usuários de teste
  FOR i IN 1..14 LOOP
    INSERT INTO users (
      organization_id,
      environment_id,
      codigo,
      email,
      senha_hash,
      nome,
      cpf,
      telefone,
      celular,
      cargo,
      departamento,
      data_admissao,
      perfil,
      status,
      tipo,
      ativo,
      estabelecimento_id,
      estabelecimentos_permitidos,
      permissoes,
      preferred_language
    ) VALUES (
      v_org_id,
      v_env_id,
      LPAD(i::text, 4, '0'),
      'usuario' || i || '@teste.com',
      '$2a$10$abcdefghijklmnopqrstuv',  -- senha hash fictício
      'Usuário Teste ' || i,
      '000.000.00' || LPAD(i::text, 1, '0') || '-00',
      '(47) 3000-000' || i,
      '(47) 99000-000' || i,
      CASE
        WHEN i <= 5 THEN 'Analista'
        WHEN i <= 10 THEN 'Assistente'
        ELSE 'Coordenador'
      END,
      CASE
        WHEN i <= 7 THEN 'Operações'
        ELSE 'Logística'
      END,
      CURRENT_DATE - (i * 30 || ' days')::interval,
      CASE
        WHEN i = 1 THEN 'administrador'
        WHEN i <= 5 THEN 'gerente'
        WHEN i <= 10 THEN 'operador'
        ELSE 'visualizador'
      END,
      CASE
        WHEN i <= 12 THEN 'ativo'
        ELSE 'inativo'
      END,
      'user',
      CASE WHEN i <= 12 THEN true ELSE false END,
      v_estabelecimento_id,
      ARRAY[v_estabelecimento_id],
      CASE
        WHEN i = 1 THEN ARRAY['all']::text[]
        ELSE ARRAY['dashboard', 'pedidos', 'cotacoes']::text[]
      END,
      'pt'
    )
    ON CONFLICT (email) DO NOTHING;
  END LOOP;

  RAISE NOTICE '14 usuários de teste inseridos com sucesso!';
END $$;

-- Verificar usuários inseridos
SELECT
  codigo,
  email,
  nome,
  cargo,
  departamento,
  perfil,
  status,
  ativo
FROM users
WHERE organization_id = (SELECT id FROM saas_organizations WHERE codigo = '00000001')
  AND environment_id = (SELECT id FROM saas_environments WHERE codigo = 'PRODUCAO')
ORDER BY codigo;
