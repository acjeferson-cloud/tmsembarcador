/*
  # Dados Demo - Parte 1: Base (Org, Ambiente, Usuário, Estabelecimentos)
  
  Cria organização demo, ambiente, usuário admin@demo.com e 3 estabelecimentos
*/

-- Organização Demo
INSERT INTO saas_organizations (id, codigo, nome, cnpj, email, telefone, status, created_at)
VALUES (gen_random_uuid(), 'DEMOLOG', 'Empresa Demo Logística Ltda', '12.345.678/0001-90',
        'contato@demolog.com.br', '(11) 3000-0000', 'ativo', NOW())
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, status = 'ativo';

-- Ambiente Produção Demo
INSERT INTO saas_environments (id, organization_id, codigo, nome, tipo, status, created_at)
VALUES (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
        'PROD-DEMO', 'Produção Demo', 'producao', 'ativo', NOW())
ON CONFLICT (organization_id, codigo) DO UPDATE SET nome = EXCLUDED.nome, status = 'ativo';

-- Usuário admin@demo.com / Demo@123
INSERT INTO users (id, organization_id, environment_id, nome, email, senha_hash, tipo, status, ativo, bloqueado, created_at)
VALUES (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
        (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
         WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
        'Administrador Demo', 'admin@demo.com', encode(digest('Demo@123', 'sha256'), 'hex'),
        'admin', 'ativo', true, false, NOW())
ON CONFLICT (email) DO UPDATE SET 
  nome = EXCLUDED.nome, 
  status = 'ativo', 
  ativo = true,
  bloqueado = false,
  organization_id = EXCLUDED.organization_id,
  environment_id = EXCLUDED.environment_id;

-- Estabelecimentos
INSERT INTO establishments (id, organization_id, environment_id, codigo, nome_fantasia, razao_social,
  cnpj, inscricao_estadual, tipo, cep, logradouro, numero, bairro, cidade, estado, pais,
  telefone, email, ativo, created_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   '0001', 'Matriz São Paulo', 'Empresa Demo Logística Ltda', '12.345.678/0001-90',
   '123.456.789.012', 'matriz', '01310-100', 'Av. Paulista', '1000', 'Bela Vista',
   'São Paulo', 'SP', 'Brasil', '(11) 3000-0001', 'matriz@demolog.com.br', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   '0002', 'Filial Rio de Janeiro', 'Empresa Demo Logística Ltda', '12.345.678/0002-71',
   '987.654.321.098', 'filial', '20040-020', 'Av. Rio Branco', '156', 'Centro',
   'Rio de Janeiro', 'RJ', 'Brasil', '(21) 3000-0002', 'rio@demolog.com.br', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   '0003', 'Filial Belo Horizonte', 'Empresa Demo Logística Ltda', '12.345.678/0003-52',
   '456.789.123.456', 'filial', '30130-000', 'Av. Afonso Pena', '867', 'Centro',
   'Belo Horizonte', 'MG', 'Brasil', '(31) 3000-0003', 'bh@demolog.com.br', true, NOW())
ON CONFLICT (organization_id, environment_id, codigo) DO UPDATE SET ativo = true;

-- Vincular usuário aos estabelecimentos
INSERT INTO user_establishments (user_id, establishment_id)
SELECT u.id, e.id FROM users u CROSS JOIN establishments e
WHERE u.email = 'admin@demo.com'
  AND e.organization_id = (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG')
ON CONFLICT (user_id, establishment_id) DO NOTHING;
