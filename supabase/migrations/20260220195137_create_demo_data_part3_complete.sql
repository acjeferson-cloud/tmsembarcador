/*
  # Dados Demo - Parte 3: Dados Operacionais Completo
  
  Cria 10 Motivos de Rejeição, 10 Ocorrências e 20 Pedidos
*/

-- Motivos de Rejeição
INSERT INTO rejection_reasons (id, organization_id, environment_id, codigo, descricao, tipo, ativo, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
  (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
   WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
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
INSERT INTO occurrences (id, organization_id, environment_id, codigo, descricao, tipo, 
  impacta_prazo, dias_impacto, notifica_cliente, ativo, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
  (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
   WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
  'OCOR' || LPAD(n::text, 3, '0'),
  CASE n
    WHEN 1 THEN 'Coleta realizada com sucesso'
    WHEN 2 THEN 'Mercadoria em trânsito'
    WHEN 3 THEN 'Saiu para entrega'
    WHEN 4 THEN 'Entrega realizada'
    WHEN 5 THEN 'Aguardando agendamento com destinatário'
    WHEN 6 THEN 'Retornando ao remetente'
    WHEN 7 THEN 'Mercadoria parada no terminal'
    WHEN 8 THEN 'Em processo de liberação alfandegária'
    WHEN 9 THEN 'Atraso na entrega previsto'
    WHEN 10 THEN 'Entrega parcial realizada'
  END,
  CASE WHEN n <= 4 THEN 'coleta' WHEN n <= 7 THEN 'transporte' ELSE 'entrega' END,
  CASE WHEN n > 5 THEN true ELSE false END,
  CASE WHEN n > 5 THEN 1 ELSE 0 END,
  true,
  true,
  NOW()
FROM generate_series(1, 10) n
ON CONFLICT (organization_id, environment_id, codigo) DO NOTHING;

-- Pedidos (20 pedidos de demonstração com tipo correto)
INSERT INTO orders (
  id, organization_id, environment_id, establishment_id, numero_pedido,
  tipo, business_partner_id, carrier_id, status, data_pedido,
  data_prevista_coleta, data_prevista_entrega,
  origem_cep, origem_cidade, origem_estado, origem_pais,
  destino_cep, destino_cidade, destino_estado, destino_pais,
  valor_mercadoria, peso_bruto, quantidade_volumes,
  observacoes, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
  (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
   WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
  (SELECT id FROM establishments WHERE codigo = '0001' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG') LIMIT 1),
  'PED' || LPAD(n::text, 6, '0'),
  'saida',
  (SELECT id FROM business_partners WHERE codigo = 'CLI001' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG') LIMIT 1),
  (SELECT id FROM carriers WHERE codigo = 'TRANS001' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG') LIMIT 1),
  CASE
    WHEN n <= 5 THEN 'pendente'
    WHEN n <= 10 THEN 'em_transito'
    WHEN n <= 15 THEN 'entregue'
    ELSE 'coletado'
  END,
  CURRENT_DATE - (n || ' days')::interval,
  CURRENT_DATE - ((n-2) || ' days')::interval,
  CURRENT_DATE + ((5-n) || ' days')::interval,
  '01310-100', 'São Paulo', 'SP', 'Brasil',
  '20040-020', 'Rio de Janeiro', 'RJ', 'Brasil',
  1000.00 + (n * 150.50), 100.00 + (n * 10.5), n,
  'Pedido de demonstração número ' || n, NOW()
FROM generate_series(1, 20) n;
