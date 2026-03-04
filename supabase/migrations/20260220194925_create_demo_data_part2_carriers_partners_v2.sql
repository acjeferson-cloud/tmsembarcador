/*
  # Dados Demo - Parte 2: Transportadores e Parceiros (valores minúsculos)
*/

-- Transportadores (8 transportadoras)
INSERT INTO carriers (id, organization_id, environment_id, codigo, nome_fantasia, razao_social,
  cnpj, inscricao_estadual, cep, logradouro, numero, bairro, cidade, estado, pais,
  telefone, email, tipo_servico, prazo_coleta, nps_interno, ativo, created_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS001', 'Expresso Rápido', 'Expresso Rápido Transportes Ltda', '11.222.333/0001-44',
   '111.222.333.444', '03001-000', 'Rua da Mooca', '1500', 'Mooca', 'São Paulo', 'SP', 'Brasil',
   '(11) 4000-1000', 'contato@expressorapido.com.br', 'Rodoviário', 2, 9, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS002', 'LogFast Nacional', 'LogFast Logística Nacional SA', '22.333.444/0001-55',
   '222.333.444.555', '04001-000', 'Av. Brigadeiro Luiz Antônio', '2000', 'Bela Vista', 'São Paulo', 'SP', 'Brasil',
   '(11) 4000-2000', 'operacoes@logfast.com.br', 'Rodoviário', 1, 8, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS003', 'Trans Sul Express', 'Trans Sul Express Transportes Ltda', '33.444.555/0001-66',
   '333.444.555.666', '90001-000', 'Av. Farrapos', '500', 'Centro', 'Porto Alegre', 'RS', 'Brasil',
   '(51) 4000-3000', 'atendimento@transsul.com.br', 'Rodoviário', 3, 9, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS004', 'Cargo Air Express', 'Cargo Air Express Ltda', '44.555.666/0001-77',
   '444.555.666.777', '04001-000', 'Av. Washington Luís', '7000', 'Aeroporto', 'São Paulo', 'SP', 'Brasil',
   '(11) 4000-4000', 'vendas@cargoair.com.br', 'Aéreo', 1, 10, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS005', 'Norte Cargas', 'Norte Cargas Transportes Ltda', '55.666.777/0001-88',
   '555.666.777.888', '66001-000', 'Av. Presidente Vargas', '1200', 'Campina', 'Belém', 'PA', 'Brasil',
   '(91) 4000-5000', 'comercial@nortecargas.com.br', 'Rodoviário', 4, 8, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS006', 'Rota Verde Logística', 'Rota Verde Logística Ltda', '66.777.888/0001-99',
   '666.777.888.999', '30001-000', 'Rua da Bahia', '1800', 'Centro', 'Belo Horizonte', 'MG', 'Brasil',
   '(31) 4000-6000', 'atendimento@rotaverde.com.br', 'Rodoviário', 2, 9, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS007', 'Marítima Brasil', 'Marítima Brasil Transportes SA', '77.888.999/0001-00',
   '777.888.999.000', '20001-000', 'Av. Rodrigues Alves', '10', 'Porto', 'Rio de Janeiro', 'RJ', 'Brasil',
   '(21) 4000-7000', 'operacoes@maritimabrasil.com.br', 'Marítimo', 7, 8, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'TRANS008', 'Expresso Nordeste', 'Expresso Nordeste Logística Ltda', '88.999.000/0001-11',
   '888.999.000.111', '50001-000', 'Av. Conde da Boa Vista', '1500', 'Boa Vista', 'Recife', 'PE', 'Brasil',
   '(81) 4000-8000', 'comercial@expressonordeste.com.br', 'Rodoviário', 3, 8, true, NOW())
ON CONFLICT (organization_id, environment_id, codigo) DO UPDATE SET ativo = true;

-- Parceiros de Negócios (10 clientes)
INSERT INTO business_partners (id, organization_id, environment_id, codigo, tipo, tipo_pessoa,
  nome_fantasia, razao_social, cpf_cnpj, inscricao_estadual, cep, logradouro, numero,
  complemento, bairro, cidade, estado, pais, telefone, email, limite_credito, observacoes, ativo, created_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI001', 'cliente', 'juridica', 'TechCorp Brasil', 'TechCorp Brasil Tecnologia Ltda',
   '10.111.222/0001-33', '101.112.223.334', '04538-132', 'Av. Brigadeiro Faria Lima', '3000',
   'Torre A - 10º andar', 'Itaim Bibi', 'São Paulo', 'SP', 'Brasil', '(11) 5000-1001',
   'compras@techcorp.com.br', 500000.00, 'Cliente Premium - Prioridade alta', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI002', 'cliente', 'juridica', 'Indústria Metal Sul', 'Indústria Metalúrgica Sul Ltda',
   '20.222.333/0001-44', '202.223.334.445', '91050-001', 'Rua Voluntários da Pátria', '4500',
   'Galpão 3', 'São Geraldo', 'Porto Alegre', 'RS', 'Brasil', '(51) 5000-2002',
   'logistica@metalsul.com.br', 300000.00, 'Envios recorrentes toda semana', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI003', 'cliente', 'juridica', 'FarmaVida', 'FarmaVida Distribuidora de Medicamentos SA',
   '30.333.444/0001-55', '303.334.445.556', '21040-360', 'Rua Dois de Dezembro', '50',
   NULL, 'Flamengo', 'Rio de Janeiro', 'RJ', 'Brasil', '(21) 5000-3003',
   'distribuicao@farmavida.com.br', 450000.00, 'Produtos sensíveis - Controle de temperatura', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI004', 'cliente', 'juridica', 'AutoParts Nacional', 'AutoParts Nacional Comércio de Peças Ltda',
   '40.444.555/0001-66', '404.445.556.667', '03173-010', 'Av. do Estado', '5533',
   NULL, 'Mooca', 'São Paulo', 'SP', 'Brasil', '(11) 5000-4004',
   'vendas@autoparts.com.br', 350000.00, 'Cliente desde 2020', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI005', 'cliente', 'juridica', 'Têxtil Minas', 'Têxtil Minas Indústria e Comércio Ltda',
   '50.555.666/0001-77', '505.556.667.778', '31270-010', 'Rua Sergipe', '1200',
   NULL, 'Savassi', 'Belo Horizonte', 'MG', 'Brasil', '(31) 5000-5005',
   'expedicao@textilminas.com.br', 280000.00, 'Entregas programadas mensalmente', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI006', 'cliente', 'juridica', 'E-Commerce Brasil', 'E-Commerce Brasil Comércio Online Ltda',
   '70.777.888/0001-99', '707.778.889.990', '04711-000', 'Av. das Nações Unidas', '12901',
   'Torre Norte - 22º', 'Brooklin', 'São Paulo', 'SP', 'Brasil', '(11) 5000-7006',
   'logistica@ecommercebr.com.br', 600000.00, 'Alto volume - Múltiplas coletas diárias', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI007', 'cliente', 'juridica', 'Alimentos Natureza', 'Alimentos Natureza Indústria e Comércio SA',
   '80.888.999/0001-00', '808.889.990.001', '13010-111', 'Av. Brasil', '2500',
   NULL, 'Centro', 'Campinas', 'SP', 'Brasil', '(19) 5000-8007',
   'expedicao@alimentosnatureza.com.br', 400000.00, 'Produtos perecíveis - Carga refrigerada', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI008', 'cliente', 'juridica', 'Móveis Design', 'Móveis Design Indústria de Móveis Ltda',
   '90.999.000/0001-11', '909.990.001.112', '89201-400', 'Rua XV de Novembro', '1500',
   NULL, 'Centro', 'Joinville', 'SC', 'Brasil', '(47) 5000-9008',
   'vendas@moveisdesign.com.br', 320000.00, 'Cargas volumosas - Proteção especial', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI009', 'cliente', 'juridica', 'Eletrônicos Prime', 'Eletrônicos Prime Distribuidora Ltda',
   '01.000.111/0001-22', '010.001.112.223', '03047-000', 'Rua Santa Rosa', '500',
   NULL, 'Brás', 'São Paulo', 'SP', 'Brasil', '(11) 5000-0009',
   'compras@eletronicosprime.com.br', 550000.00, 'Alto valor agregado - Seguro obrigatório', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM saas_organizations WHERE codigo = 'DEMOLOG'),
   (SELECT e.id FROM saas_environments e INNER JOIN saas_organizations o ON e.organization_id = o.id 
    WHERE o.codigo = 'DEMOLOG' AND e.codigo = 'PROD-DEMO'),
   'CLI010', 'cliente', 'juridica', 'Cosméticos Bela', 'Cosméticos Bela Indústria Ltda',
   '03.222.333/0001-44', '032.223.334.445', '01310-200', 'Av. Paulista', '2000',
   'Conjunto 1501', 'Bela Vista', 'São Paulo', 'SP', 'Brasil', '(11) 5000-0003',
   'logistica@cosmeticosbela.com.br', 380000.00, 'Produtos frágeis - Manuseio cuidadoso', true, NOW())
ON CONFLICT (organization_id, environment_id, codigo) DO UPDATE SET ativo = true;
