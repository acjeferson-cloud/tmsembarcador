-- ============================================================================
-- DADOS OPERACIONAIS DE DEMONSTRAÇÃO - PEDIDOS, NFS, COLETAS, CTES
-- ============================================================================
-- Execute este script no Supabase SQL Editor após as migrações Part1 e Part2
-- ============================================================================

-- Variáveis auxiliares (IDs serão buscados dinamicamente)
DO $$
DECLARE
  v_org_id uuid;
  v_env_id uuid;
  v_estab_sp_id uuid;
  v_estab_rj_id uuid;
  v_estab_bh_id uuid;
  v_carrier1_id uuid;
  v_carrier2_id uuid;
  v_client1_id uuid;
  v_client2_id uuid;
  v_client3_id uuid;
BEGIN
  -- Buscar IDs
  SELECT id INTO v_org_id FROM saas_organizations WHERE codigo = 'DEMOLOG';
  SELECT id INTO v_env_id FROM saas_environments WHERE codigo = 'PROD-DEMO';
  SELECT id INTO v_estab_sp_id FROM establishments WHERE codigo = '0001' AND organization_id = v_org_id;
  SELECT id INTO v_estab_rj_id FROM establishments WHERE codigo = '0002' AND organization_id = v_org_id;
  SELECT id INTO v_estab_bh_id FROM establishments WHERE codigo = '0003' AND organization_id = v_org_id;
  SELECT id INTO v_carrier1_id FROM carriers WHERE codigo = 'TRANS001' AND organization_id = v_org_id;
  SELECT id INTO v_carrier2_id FROM carriers WHERE codigo = 'TRANS002' AND organization_id = v_org_id;
  SELECT id INTO v_client1_id FROM business_partners WHERE codigo = 'CLI001' AND organization_id = v_org_id;
  SELECT id INTO v_client2_id FROM business_partners WHERE codigo = 'CLI002' AND organization_id = v_org_id;
  SELECT id INTO v_client3_id FROM business_partners WHERE codigo = 'CLI003' AND organization_id = v_org_id;

  -- Criar 20 Pedidos
  FOR i IN 1..20 LOOP
    INSERT INTO orders (
      id, organization_id, environment_id, establishment_id, numero_pedido,
      tipo, business_partner_id, carrier_id, status, data_pedido,
      data_prevista_coleta, data_prevista_entrega,
      origem_cep, origem_cidade, origem_estado, origem_pais,
      destino_cep, destino_cidade, destino_estado, destino_pais,
      valor_mercadoria, peso_total, volume_total, quantidade_volumes,
      observacoes, created_at
    ) VALUES (
      gen_random_uuid(), v_org_id, v_env_id,
      CASE WHEN i % 3 = 0 THEN v_estab_bh_id WHEN i % 2 = 0 THEN v_estab_rj_id ELSE v_estab_sp_id END,
      'PED' || LPAD(i::text, 6, '0'),
      'entrega',
      CASE WHEN i % 3 = 0 THEN v_client3_id WHEN i % 2 = 0 THEN v_client2_id ELSE v_client1_id END,
      CASE WHEN i % 2 = 0 THEN v_carrier2_id ELSE v_carrier1_id END,
      CASE
        WHEN i <= 5 THEN 'pendente'
        WHEN i <= 10 THEN 'em_transito'
        WHEN i <= 15 THEN 'entregue'
        ELSE 'coletado'
      END,
      CURRENT_DATE - (i || ' days')::interval,
      CURRENT_DATE - ((i-2) || ' days')::interval,
      CURRENT_DATE + ((5-i) || ' days')::interval,
      '01310-100', 'São Paulo', 'SP', 'Brasil',
      '20040-020', 'Rio de Janeiro', 'RJ', 'Brasil',
      1000.00 + (i * 150.50), 100.00 + (i * 10.5), 5 + i, i,
      'Pedido de demonstração ' || i, NOW()
    );
  END LOOP;

  RAISE NOTICE 'Dados operacionais criados com sucesso!';
END $$;

-- Motivos de Rejeição
INSERT INTO rejection_reasons (
  id, organization_id, environment_id, codigo, descricao, tipo, ativo, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
  (SELECT id FROM saas_environments WHERE codigo = 'PROD-DEMO'),
  'REJ' || LPAD(n::text, 3, '0'),
  CASE n
    WHEN 1 THEN 'Destinatário ausente'
    WHEN 2 THEN 'Endereço incorreto'
    WHEN 3 THEN 'Recusa do destinatário'
    WHEN 4 THEN 'Área de risco'
    WHEN 5 THEN 'Avaria na mercadoria'
    WHEN 6 THEN 'Documentação incompleta'
    WHEN 7 THEN 'Falta de recursos para descarga'
    WHEN 8 THEN 'Horário inadequado'
    WHEN 9 THEN 'Mercadoria extraviada'
    WHEN 10 THEN 'Outros motivos'
  END,
  'entrega',
  true,
  NOW()
FROM generate_series(1, 10) n
ON CONFLICT (organization_id, environment_id, codigo) DO NOTHING;

-- Ocorrências
INSERT INTO occurrences (
  id, organization_id, environment_id, codigo, descricao, tipo,
  categoria, impacto, requer_acao, ativo, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
  (SELECT id FROM saas_environments WHERE codigo = 'PROD-DEMO'),
  'OCOR' || LPAD(n::text, 3, '0'),
  CASE n
    WHEN 1 THEN 'Coleta realizada'
    WHEN 2 THEN 'Em trânsito'
    WHEN 3 THEN 'Saiu para entrega'
    WHEN 4 THEN 'Entrega realizada'
    WHEN 5 THEN 'Aguardando agendamento'
    WHEN 6 THEN 'Retornando ao remetente'
    WHEN 7 THEN 'Parado no terminal'
    WHEN 8 THEN 'Em processo de liberação'
    WHEN 9 THEN 'Atraso na entrega'
    WHEN 10 THEN 'Entrega parcial realizada'
  END,
  CASE WHEN n <= 4 THEN 'normal' WHEN n <= 8 THEN 'atencao' ELSE 'critica' END,
  'rastreamento',
  CASE WHEN n <= 4 THEN 'baixo' WHEN n <= 8 THEN 'medio' ELSE 'alto' END,
  CASE WHEN n > 5 THEN true ELSE false END,
  true,
  NOW()
FROM generate_series(1, 10) n
ON CONFLICT (organization_id, environment_id, codigo) DO NOTHING;
