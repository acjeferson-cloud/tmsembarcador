/*
  ============================================================================
  SCRIPT COMPLETO DE DADOS DE DEMONSTRAÇÃO PARA TMS
  ============================================================================

  Usuário: admin@demo.com
  Senha: Demo@123

  Este script cria um ambiente completo de demonstração com:
  - 1 Organização
  - 1 Ambiente de produção
  - 1 Usuário administrador
  - 3 Estabelecimentos
  - 8 Transportadores
  - 15 Parceiros de negócios
  - 50 Pedidos
  - 50 Notas Fiscais
  - 30 Coletas
  - 45 CT-es
  - 5 Tabelas de Frete
  - 25 Ocorrências
  - 10 Motivos de Rejeição
  ============================================================================
*/

-- ============================================================================
-- 1. ORGANIZAÇÃO E AMBIENTE
-- ============================================================================

INSERT INTO saas_organizations (
  id, codigo, nome, cnpj, email, telefone, status, created_at
) VALUES (
  gen_random_uuid(),
  'DEMOLOG',
  'Empresa Demo Logística Ltda',
  '12.345.678/0001-90',
  'contato@demolog.com.br',
  '(11) 3000-0000',
  'ativo',
  NOW()
) ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, status = 'ativo';

INSERT INTO saas_environments (
  id, organization_id, codigo, nome, tipo, status, created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
  'PROD-DEMO',
  'Produção Demo',
  'producao',
  'ativo',
  NOW()
) ON CONFLICT (organization_id, codigo) DO UPDATE SET nome = EXCLUDED.nome, status = 'ativo';

-- ============================================================================
-- 2. USUÁRIO DEMO
-- ============================================================================

INSERT INTO users (
  id, organization_id, environment_id, nome, email, senha, tipo, status, bloqueado, created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
  (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
  'Administrador Demo',
  'admin@demo.com',
  encode(digest('Demo@123', 'sha256'), 'hex'),
  'admin',
  'ativo',
  false,
  NOW()
) ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, status = 'ativo', bloqueado = false;

-- ============================================================================
-- 3. ESTABELECIMENTOS
-- ============================================================================

INSERT INTO establishments (
  id, organization_id, environment_id, codigo, nome_fantasia, razao_social,
  cnpj, inscricao_estadual, tipo, cep, logradouro, numero, bairro, cidade,
  estado, pais, telefone, email, ativo, created_at
) VALUES
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    '0001', 'Matriz São Paulo', 'Empresa Demo Logística Ltda',
    '12.345.678/0001-90', '123.456.789.012', 'Matriz', '01310-100',
    'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', 'Brasil',
    '(11) 3000-0001', 'matriz@demolog.com.br', true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    '0002', 'Filial Rio de Janeiro', 'Empresa Demo Logística Ltda',
    '12.345.678/0002-71', '987.654.321.098', 'Filial', '20040-020',
    'Av. Rio Branco', '156', 'Centro', 'Rio de Janeiro', 'RJ', 'Brasil',
    '(21) 3000-0002', 'rio@demolog.com.br', true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    '0003', 'Filial Belo Horizonte', 'Empresa Demo Logística Ltda',
    '12.345.678/0003-52', '456.789.123.456', 'Filial', '30130-000',
    'Av. Afonso Pena', '867', 'Centro', 'Belo Horizonte', 'MG', 'Brasil',
    '(31) 3000-0003', 'bh@demolog.com.br', true, NOW()
  )
ON CONFLICT (organization_id, environment_id, codigo) DO UPDATE SET ativo = true;

-- Vincular usuário aos estabelecimentos
INSERT INTO user_establishments (user_id, establishment_id)
SELECT u.id, e.id
FROM users u
CROSS JOIN establishments e
WHERE u.email = 'admin@demo.com'
  AND e.organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG')
ON CONFLICT (user_id, establishment_id) DO NOTHING;

-- ============================================================================
-- 4. TRANSPORTADORES
-- ============================================================================

INSERT INTO carriers (
  id, organization_id, environment_id, codigo, nome_fantasia, razao_social,
  cnpj, inscricao_estadual, cep, logradouro, numero, bairro, cidade, estado,
  pais, telefone, email, tipo_servico, prazo_coleta, nps_interno, ativo, created_at
) VALUES
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS001', 'Expresso Rápido', 'Expresso Rápido Transportes Ltda',
    '11.222.333/0001-44', '111.222.333.444', '03001-000', 'Rua da Mooca',
    '1500', 'Mooca', 'São Paulo', 'SP', 'Brasil', '(11) 4000-1000',
    'contato@expressorapido.com.br', 'Rodoviário', 2, 9, true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS002', 'LogFast Nacional', 'LogFast Logística Nacional SA',
    '22.333.444/0001-55', '222.333.444.555', '04001-000', 'Av. Brigadeiro Luiz Antônio',
    '2000', 'Bela Vista', 'São Paulo', 'SP', 'Brasil', '(11) 4000-2000',
    'operacoes@logfast.com.br', 'Rodoviário', 1, 8, true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS003', 'Trans Sul Express', 'Trans Sul Express Transportes Ltda',
    '33.444.555/0001-66', '333.444.555.666', '90001-000', 'Av. Farrapos',
    '500', 'Centro', 'Porto Alegre', 'RS', 'Brasil', '(51) 4000-3000',
    'atendimento@transsul.com.br', 'Rodoviário', 3, 9, true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS004', 'Cargo Air Express', 'Cargo Air Express Ltda',
    '44.555.666/0001-77', '444.555.666.777', '04001-000', 'Av. Washington Luís',
    '7000', 'Aeroporto', 'São Paulo', 'SP', 'Brasil', '(11) 4000-4000',
    'vendas@cargoair.com.br', 'Aéreo', 1, 10, true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS005', 'Norte Cargas', 'Norte Cargas Transportes Ltda',
    '55.666.777/0001-88', '555.666.777.888', '66001-000', 'Av. Presidente Vargas',
    '1200', 'Campina', 'Belém', 'PA', 'Brasil', '(91) 4000-5000',
    'comercial@nortecargas.com.br', 'Rodoviário', 4, 8, true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS006', 'Rota Verde Logística', 'Rota Verde Logística Ltda',
    '66.777.888/0001-99', '666.777.888.999', '30001-000', 'Rua da Bahia',
    '1800', 'Centro', 'Belo Horizonte', 'MG', 'Brasil', '(31) 4000-6000',
    'atendimento@rotaverde.com.br', 'Rodoviário', 2, 9, true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS007', 'Marítima Brasil', 'Marítima Brasil Transportes SA',
    '77.888.999/0001-00', '777.888.999.000', '20001-000', 'Av. Rodrigues Alves',
    '10', 'Porto', 'Rio de Janeiro', 'RJ', 'Brasil', '(21) 4000-7000',
    'operacoes@maritimabrasil.com.br', 'Marítimo', 7, 8, true, NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
    (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
    'TRANS008', 'Expresso Nordeste', 'Expresso Nordeste Logística Ltda',
    '88.999.000/0001-11', '888.999.000.111', '50001-000', 'Av. Conde da Boa Vista',
    '1500', 'Boa Vista', 'Recife', 'PE', 'Brasil', '(81) 4000-8000',
    'comercial@expressonordeste.com.br', 'Rodoviário', 3, 8, true, NOW()
  )
ON CONFLICT (organization_id, environment_id, codigo) DO UPDATE SET ativo = true;

-- ============================================================================
-- Continua no próximo bloco devido ao tamanho...
-- ============================================================================
