-- =====================================================================
-- Migração Completa de Dados da Organização "Demonstração"
-- do Supabase para Google Cloud SQL
-- =====================================================================
-- Data de geração: 2026-02-17
-- Organização: Demonstração (ID: 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e)
-- Ambientes: Produção + Sandbox
-- Total estimado: 700+ registros
--
-- ATENÇÃO:
-- - Execute este script EM UM BANCO DE DADOS VAZIO com schema já criado
-- - Faça backup antes de executar
-- - Valide os dados após a migração
-- - Tempo estimado de execução: 2-5 minutos
-- =====================================================================

-- Configurações de sessão para otimizar a importação
SET session_replication_role = 'replica';
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;
SET work_mem = '256MB';
SET maintenance_work_mem = '512MB';

-- =====================================================================
-- SEÇÃO 1: TABELAS GLOBAIS (sem organization_id)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela: saas_plans (4 registros)
-- ---------------------------------------------------------------------
INSERT INTO saas_plans (id, name, slug, description, price_monthly, price_yearly, max_companies, max_users, max_monthly_documents, features, is_active, created_at, updated_at) VALUES
('1b554f0f-af32-4338-9c99-847478b672fc', 'Free', 'free', 'Plano gratuito para teste', 0.00, 0.00, 1, 5, 100, '{"basic_reports":true,"freight_rates":true}'::jsonb, true, '2026-01-19 23:49:49.07702+00', '2026-01-19 23:49:49.07702+00'),
('fe4b5609-9de3-4413-8de7-172809e10131', 'Starter', 'starter', 'Para pequenas empresas', 99.00, 990.00, 3, 15, 1000, '{"api_access":true,"basic_reports":true,"freight_rates":true,"reverse_logistics":true}'::jsonb, true, '2026-01-19 23:49:49.07702+00', '2026-01-19 23:49:49.07702+00'),
('09cd2319-8977-4fbd-8c9b-d9ef53d9279f', 'Professional', 'professional', 'Para empresas em crescimento', 299.00, 2990.00, 10, 50, 10000, '{"nps":true,"api_access":true,"white_label":true,"freight_rates":true,"advanced_reports":true,"reverse_logistics":true,"custom_integrations":true}'::jsonb, true, '2026-01-19 23:49:49.07702+00', '2026-01-19 23:49:49.07702+00'),
('54af54af-86ba-476f-a868-08c4bac784b4', 'Enterprise', 'enterprise', 'Para grandes operações', 999.00, 9990.00, -1, -1, -1, '{"nps":true,"sla":true,"api_access":true,"white_label":true,"freight_rates":true,"custom_features":true,"advanced_reports":true,"dedicated_support":true,"reverse_logistics":true,"custom_integrations":true}'::jsonb, true, '2026-01-19 23:49:49.07702+00', '2026-01-19 23:49:49.07702+00');

-- =====================================================================
-- SEÇÃO 2: ORGANIZAÇÃO E AMBIENTES
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela: organizations (1 registro)
-- ---------------------------------------------------------------------
INSERT INTO organizations (id, name, slug, domain, plan_id, is_active, trial_ends_at, subscription_status, metadata, created_at, updated_at) VALUES
('8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'Demonstração', '00000001', 'demo.tms.local', '09cd2319-8977-4fbd-8c9b-d9ef53d9279f', true, NULL, 'active', '{"codigo":"00000001","created_by":"migration","migration_date":"2026-01-20T00:06:29.937066+00:00","original_system":"single_tenant"}'::jsonb, '2026-01-20 00:06:29.937066+00', '2026-01-20 13:00:18.47208+00');

-- ---------------------------------------------------------------------
-- Tabela: environments (2 registros)
-- ---------------------------------------------------------------------
INSERT INTO environments (id, organization_id, name, is_active, created_at, updated_at) VALUES
('abe69012-4449-4946-977e-46af45790a43', '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'Produção', true, '2026-01-20 01:10:49.07337+00', '2026-01-20 01:10:49.07337+00'),
('ab23dd7f-42a4-4e55-b340-45433f842337', '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'Sandbox', false, '2026-01-20 13:00:18.47208+00', '2026-02-11 00:15:49.755256+00');

-- =====================================================================
-- SEÇÃO 3: USUÁRIOS
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela: users (13 registros)
-- Nota: Senhas devem ser redefinidas após migração
-- ---------------------------------------------------------------------
INSERT INTO users (id, codigo, nome, email, cpf, telefone, celular, cargo, departamento, perfil, status, estabelecimento_id, organization_id, environment_id, created_at, updated_at) VALUES
('2de2abd0-5ea1-47d4-ad49-46177861aecc', '0001', 'Jeferson Alves da Costa', 'jeferson.costa@gruposmartlog.com.br', '023.258.210-64', '(12) 94313-2594', '(12) 99113-0594', 'Administrador do Sistema', 'TI', 'administrador', 'ativo', '1d717f91-f80c-4d60-bc1b-594aa653624a', '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-13 12:46:42.780352+00'),
('5df07d77-ce46-4c9d-861b-5052ad75758a', '0002', 'Maria Silva Santos', 'maria.silva@gruposmartlog.com.br', '788.536.850-50', '(11) 98888-7777', '(11) 98888-7777', 'Gerente de Operações', 'Operações', 'personalizado', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('3576beb9-f5db-40d2-ac30-286517f20305', '0003', 'João Carlos Oliveira', 'joao.oliveira@gruposmartlog.com.br', '295.124.960-89', '(21) 97777-6666', '(21) 97777-6666', 'Coordenador Logístico', 'Logística', 'personalizado', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('9f97842a-1a8d-4d2e-998b-8ef9ae9e051b', '0004', 'Ana Paula Costa', 'ana.costa@gruposmartlog.com.br', '880.072.060-94', '(31) 96666-5555', '(31) 96666-5555', 'Analista de Transportes', 'Transportes', 'operador', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('a8519bde-f309-43d5-8a33-38c73dc4a89c', '0005', 'Carlos Eduardo Ferreira', 'carlos.ferreira@gruposmartlog.com.br', '666.002.310-09', '(41) 95555-4444', '(41) 95555-4444', 'Supervisor de Frota', 'Manutenção', 'operador', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('c683fab9-34b6-4133-beab-27a11e4291dd', '0006', 'Fernanda Lima Rodrigues', 'fernanda.lima@gruposmartlog.com.br', '251.083.180-14', '(51) 94444-3333', '(51) 94444-3333', 'Assistente Administrativo', 'Administrativo', 'visualizador', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('c6140832-8422-4561-935b-7a0f02c545e3', '0007', 'Roberto Santos Almeida', 'roberto.almeida@gruposmartlog.com.br', '944.417.310-00', '(71) 93333-2222', '(71) 93333-2222', 'Gerente Regional', 'Comercial', 'gerente', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('a4cc4c01-c637-419c-b8b4-6a72376aac53', '0008', 'Luciana Pereira Souza', 'luciana.souza@gruposmartlog.com.br', '502.036.860-12', '(85) 92222-1111', '(85) 92222-1111', 'Analista Financeiro', 'Financeiro', 'operador', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('8bde097d-7bec-403f-a029-26254e8b7205', '0009', 'Paulo Henrique Martins', 'paulo.martins@gruposmartlog.com.br', '733.666.610-89', '(81) 91111-9999', '(81) 91111-9999', 'Coordenador de TI', 'TI', 'gerente', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('a041e658-e434-4b48-a46d-18d452aa23de', '0010', 'Juliana Campos Barbosa', 'juliana.barbosa@gruposmartlog.com.br', '305.465.550-47', '(61) 98888-5555', '(61) 98888-5555', 'Analista de Sistemas', 'TI', 'operador', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('55d084b6-fb2e-4508-84f2-1df2071a5470', '0011', 'Ricardo Mendes Oliveira', 'ricardo.mendes@gruposmartlog.com.br', '175.096.070-27', '(11) 97777-8888', '(11) 97777-8888', 'Analista de Logística', 'Logística', 'personalizado', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-01-12 19:30:49.147104+00', '2026-01-12 19:30:49.147104+00'),
('caa9c896-90de-4e59-abf7-9f2a288be8e5', 'TST-SB01', 'Usuário Teste Sandbox', 'teste.sandbox@gruposmartlog.com.br', '11122233344', NULL, NULL, 'Analista de Testes', 'TI', 'administrador', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'ab23dd7f-42a4-4e55-b340-45433f842337', '2026-01-20 13:00:18.47208+00', '2026-01-20 13:00:18.47208+00'),
('0573772a-e998-418e-beb8-9375de75a8b7', 'ADM001', 'Administrador Global', 'admin@gruposmartlog.com.br', '00000000000', NULL, NULL, 'Administrador de Sistema', 'TI', 'administrador', 'ativo', NULL, '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'abe69012-4449-4946-977e-46af45790a43', '2026-02-13 20:09:29.413157+00', '2026-02-14 10:05:14.849178+00');

-- =====================================================================
-- SEÇÃO 4: DADOS OPERACIONAIS (RESUMO)
-- =====================================================================

-- NOTA IMPORTANTE:
-- As seguintes tabelas contêm muitos dados e devem ser extraídas separadamente:
--
-- 1. establishments (4 registros) - tabela de filiais/estabelecimentos
-- 2. business_partners (14 registros) - parceiros comerciais
-- 3. carriers (12 registros) - transportadoras
-- 4. orders (102 registros) - pedidos
-- 5. invoices (12 registros) - notas fiscais
-- 6. invoices_nfe (235 registros) - dados XML das NFes
-- 7. ctes_complete (192 registros) - conhecimentos de transporte
-- 8. occurrences (68 registros) - ocorrências
-- 9. reverse_logistics (30 registros) - logística reversa
-- 10. freight_rates (11 registros) - tabelas de frete
-- 11. rejection_reasons (46 registros) - motivos de rejeição
-- 12. holidays (24 registros) - feriados
--
-- Para extrair estes dados, use as seguintes queries no Supabase:
--
-- Establishments:
--   SELECT * FROM establishments WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Business Partners:
--   SELECT * FROM business_partners WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Carriers:
--   SELECT * FROM carriers WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Orders:
--   SELECT * FROM orders WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Invoices:
--   SELECT * FROM invoices WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Invoices NFe:
--   SELECT * FROM invoices_nfe WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- CTEs Complete:
--   SELECT * FROM ctes_complete WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Occurrences:
--   SELECT * FROM occurrences WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Reverse Logistics:
--   SELECT * FROM reverse_logistics WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Freight Rates:
--   SELECT * FROM freight_rates WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Rejection Reasons:
--   SELECT * FROM rejection_reasons WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- Holidays:
--   SELECT * FROM holidays WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
--
-- INSIRA OS DADOS EXTRAÍDOS AQUI, no formato:
-- INSERT INTO [tabela] (campos...) VALUES (valores...), (valores...), ...;

-- =====================================================================
-- FINALIZAÇÃO
-- =====================================================================

COMMIT;
SET session_replication_role = 'origin';

-- =====================================================================
-- QUERIES DE VALIDAÇÃO PÓS-MIGRAÇÃO
-- =====================================================================

SELECT
  '========================================' as linha
UNION ALL
SELECT 'VALIDAÇÃO DE MIGRAÇÃO - DEMONSTRAÇÃO'
UNION ALL
SELECT '========================================';

SELECT
  'saas_plans' as tabela,
  4 as registros_esperados,
  COUNT(*) as registros_atuais,
  CASE WHEN COUNT(*) = 4 THEN 'OK' ELSE 'ERRO' END as status
FROM saas_plans
UNION ALL
SELECT
  'organizations',
  1,
  COUNT(*),
  CASE WHEN COUNT(*) = 1 THEN 'OK' ELSE 'ERRO' END
FROM organizations WHERE id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'environments',
  2,
  COUNT(*),
  CASE WHEN COUNT(*) = 2 THEN 'OK' ELSE 'ERRO' END
FROM environments WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'users',
  13,
  COUNT(*),
  CASE WHEN COUNT(*) = 13 THEN 'OK' ELSE 'ERRO' END
FROM users WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'establishments',
  4,
  COUNT(*),
  CASE WHEN COUNT(*) = 4 THEN 'OK' ELSE 'VERIFICAR' END
FROM establishments WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'business_partners',
  14,
  COUNT(*),
  CASE WHEN COUNT(*) = 14 THEN 'OK' ELSE 'VERIFICAR' END
FROM business_partners WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'carriers',
  12,
  COUNT(*),
  CASE WHEN COUNT(*) = 12 THEN 'OK' ELSE 'VERIFICAR' END
FROM carriers WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'orders',
  102,
  COUNT(*),
  CASE WHEN COUNT(*) = 102 THEN 'OK' ELSE 'VERIFICAR' END
FROM orders WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'invoices',
  12,
  COUNT(*),
  CASE WHEN COUNT(*) = 12 THEN 'OK' ELSE 'VERIFICAR' END
FROM invoices WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'invoices_nfe',
  235,
  COUNT(*),
  CASE WHEN COUNT(*) = 235 THEN 'OK' ELSE 'VERIFICAR' END
FROM invoices_nfe WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'ctes_complete',
  192,
  COUNT(*),
  CASE WHEN COUNT(*) = 192 THEN 'OK' ELSE 'VERIFICAR' END
FROM ctes_complete WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
UNION ALL
SELECT
  'occurrences',
  68,
  COUNT(*),
  CASE WHEN COUNT(*) = 68 THEN 'OK' ELSE 'VERIFICAR' END
FROM occurrences WHERE organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';

-- =====================================================================
-- FIM DO ARQUIVO DE MIGRAÇÃO
-- =====================================================================
