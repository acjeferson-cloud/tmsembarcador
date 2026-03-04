/*
  # Distribuir Pedidos entre os 3 Estabelecimentos
  
  Atualiza os 20 pedidos existentes para distribuí-los entre as 3 filiais
  e cria mais 30 pedidos para totalizar 50 pedidos bem distribuídos
*/

-- Distribuir os 20 pedidos existentes entre os 3 estabelecimentos
UPDATE orders
SET establishment_id = (
  SELECT id FROM establishments 
  WHERE codigo = '0002' 
  AND organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239'
)
WHERE numero_pedido IN ('PED000007', 'PED000008', 'PED000009', 'PED000013', 'PED000014', 'PED000015', 'PED000019', 'PED000020');

UPDATE orders
SET establishment_id = (
  SELECT id FROM establishments 
  WHERE codigo = '0003' 
  AND organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239'
)
WHERE numero_pedido IN ('PED000004', 'PED000005', 'PED000006', 'PED000010', 'PED000011', 'PED000012', 'PED000016', 'PED000017', 'PED000018');

-- Criar mais 30 pedidos distribuídos entre os 3 estabelecimentos
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
  -- Distribuir entre os 3 estabelecimentos
  CASE 
    WHEN n % 3 = 0 THEN (SELECT id FROM establishments WHERE codigo = '0003' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    WHEN n % 3 = 1 THEN (SELECT id FROM establishments WHERE codigo = '0001' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    ELSE (SELECT id FROM establishments WHERE codigo = '0002' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
  END,
  'PED' || LPAD((n+20)::text, 6, '0'),
  'saida',
  -- Variar entre os clientes
  CASE 
    WHEN n % 5 = 0 THEN (SELECT id FROM business_partners WHERE codigo = 'CLI005' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    WHEN n % 4 = 0 THEN (SELECT id FROM business_partners WHERE codigo = 'CLI004' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    WHEN n % 3 = 0 THEN (SELECT id FROM business_partners WHERE codigo = 'CLI003' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    WHEN n % 2 = 0 THEN (SELECT id FROM business_partners WHERE codigo = 'CLI002' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    ELSE (SELECT id FROM business_partners WHERE codigo = 'CLI001' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
  END,
  -- Variar entre os transportadores
  CASE 
    WHEN n % 4 = 0 THEN (SELECT id FROM carriers WHERE codigo = 'TRANS004' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    WHEN n % 3 = 0 THEN (SELECT id FROM carriers WHERE codigo = 'TRANS003' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    WHEN n % 2 = 0 THEN (SELECT id FROM carriers WHERE codigo = 'TRANS002' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
    ELSE (SELECT id FROM carriers WHERE codigo = 'TRANS001' AND organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'))
  END,
  -- Status variados
  CASE
    WHEN n <= 8 THEN 'pendente'
    WHEN n <= 16 THEN 'em_transito'
    WHEN n <= 24 THEN 'entregue'
    ELSE 'coletado'
  END,
  CURRENT_DATE - ((n+20) || ' days')::interval,
  CURRENT_DATE - ((n+18) || ' days')::interval,
  CURRENT_DATE + ((5-n) || ' days')::interval,
  '01310-100', 'São Paulo', 'SP', 'Brasil',
  CASE 
    WHEN n % 3 = 0 THEN '30130-000'
    WHEN n % 2 = 0 THEN '20040-020'
    ELSE '90001-000'
  END,
  CASE 
    WHEN n % 3 = 0 THEN 'Belo Horizonte'
    WHEN n % 2 = 0 THEN 'Rio de Janeiro'
    ELSE 'Porto Alegre'
  END,
  CASE 
    WHEN n % 3 = 0 THEN 'MG'
    WHEN n % 2 = 0 THEN 'RJ'
    ELSE 'RS'
  END,
  'Brasil',
  1500.00 + (n * 200.75), 150.00 + (n * 15.25), n,
  'Pedido de demonstração - Número ' || (n+20), NOW()
FROM generate_series(1, 30) n;
