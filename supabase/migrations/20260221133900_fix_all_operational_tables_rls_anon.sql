/*
  # Corrigir RLS de TODAS as Tabelas Operacionais para Permitir Acesso Anônimo
  
  Sistema usa autenticação customizada (tms_login), então usuários fazem queries
  como role "anon" (não autenticados no Supabase Auth).
  
  Esta migração corrige RLS para TODAS as tabelas operacionais:
  - Parceiros de Negócios
  - Cotação de Fretes
  - Pedidos
  - Notas Fiscais
  - Coletas
  - CT-es
  - Faturas (não existe tabela específica, usa invoices)
  - Rastreamento (usa orders/pickups)
  - Logística Reversa (não existe tabela específica ainda)
  - Documentos Eletrônicos (usa invoices/ctes)
  - E todas as tabelas auxiliares
*/

-- ==============================================================================
-- TABELAS OPERACIONAIS PRINCIPAIS
-- ==============================================================================

-- PARCEIROS DE NEGÓCIOS
DO $$
BEGIN
  -- Drop políticas antigas
  EXECUTE 'DROP POLICY IF EXISTS "Users can read business_partners in their org/env" ON business_partners';
  EXECUTE 'DROP POLICY IF EXISTS "Allow access business_partners for anon" ON business_partners';
  
  -- Criar políticas novas para anon
  EXECUTE 'CREATE POLICY "anon_all_business_partners" ON business_partners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
END $$;

-- Endereços de Parceiros
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_partner_addresses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage addresses" ON business_partner_addresses';
    EXECUTE 'CREATE POLICY "anon_all_partner_addresses" ON business_partner_addresses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Contatos de Parceiros
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_partner_contacts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage contacts" ON business_partner_contacts';
    EXECUTE 'CREATE POLICY "anon_all_partner_contacts" ON business_partner_contacts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- PEDIDOS
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can read orders in their org/env" ON orders';
  EXECUTE 'DROP POLICY IF EXISTS "Allow access orders for anon" ON orders';
  EXECUTE 'CREATE POLICY "anon_all_orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
END $$;

-- NOTAS FISCAIS (INVOICES)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage invoices" ON invoices';
    EXECUTE 'CREATE POLICY "anon_all_invoices" ON invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- COLETAS (PICKUPS)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pickups') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage pickups" ON pickups';
    EXECUTE 'CREATE POLICY "anon_all_pickups" ON pickups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Notas Fiscais de Coletas
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pickup_invoices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage pickup_invoices" ON pickup_invoices';
    EXECUTE 'CREATE POLICY "anon_all_pickup_invoices" ON pickup_invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- CT-ES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ctes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage ctes" ON ctes';
    EXECUTE 'CREATE POLICY "anon_all_ctes" ON ctes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ==============================================================================
-- TABELAS DE CADASTROS/CONFIGURAÇÕES
-- ==============================================================================

-- ESTABELECIMENTOS
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can read establishments in their org/env" ON establishments';
  EXECUTE 'DROP POLICY IF EXISTS "Allow access establishments for anon" ON establishments';
  EXECUTE 'CREATE POLICY "anon_all_establishments" ON establishments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
END $$;

-- USUÁRIOS
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can read users in their org/env" ON users';
  EXECUTE 'DROP POLICY IF EXISTS "Allow access users for anon" ON users';
  EXECUTE 'CREATE POLICY "anon_all_users" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
END $$;

-- Estabelecimentos de Usuários
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_establishments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage their establishments" ON user_establishments';
    EXECUTE 'CREATE POLICY "anon_all_user_establishments" ON user_establishments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- OCORRÊNCIAS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'occurrences') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read occurrences in their org/env" ON occurrences';
    EXECUTE 'DROP POLICY IF EXISTS "Allow access occurrences for anon" ON occurrences';
    EXECUTE 'CREATE POLICY "anon_all_occurrences" ON occurrences FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- MOTIVOS DE REJEIÇÃO
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rejection_reasons') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read rejection_reasons in their org/env" ON rejection_reasons';
    EXECUTE 'DROP POLICY IF EXISTS "Allow access rejection_reasons for anon" ON rejection_reasons';
    EXECUTE 'CREATE POLICY "anon_all_rejection_reasons" ON rejection_reasons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ==============================================================================
-- TABELAS DE FRETE
-- ==============================================================================

-- TABELAS DE FRETE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'freight_rates') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can read freight_rates in their org/env" ON freight_rates';
    EXECUTE 'DROP POLICY IF EXISTS "Allow access freight_rates for anon" ON freight_rates';
    EXECUTE 'CREATE POLICY "anon_all_freight_rates" ON freight_rates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Valores de Frete
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'freight_rate_values') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage freight values" ON freight_rate_values';
    EXECUTE 'CREATE POLICY "anon_all_freight_rate_values" ON freight_rate_values FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Cidades de Frete
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'freight_rate_cities') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage freight cities" ON freight_rate_cities';
    EXECUTE 'CREATE POLICY "anon_all_freight_rate_cities" ON freight_rate_cities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Taxas Adicionais
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'additional_fees') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage additional fees" ON additional_fees';
    EXECUTE 'CREATE POLICY "anon_all_additional_fees" ON additional_fees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Itens Restritos
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'restricted_items') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage restricted items" ON restricted_items';
    EXECUTE 'CREATE POLICY "anon_all_restricted_items" ON restricted_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- COTAÇÕES DE FRETE
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'freight_quotes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage freight quotes" ON freight_quotes';
    EXECUTE 'CREATE POLICY "anon_all_freight_quotes" ON freight_quotes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ==============================================================================
-- TABELAS DE LOCALIZAÇÃO
-- ==============================================================================

-- PAÍSES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'countries') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read countries" ON countries';
    EXECUTE 'CREATE POLICY "anon_all_countries" ON countries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ESTADOS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'states') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read states" ON states';
    EXECUTE 'CREATE POLICY "anon_all_states" ON states FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- CIDADES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cities') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read cities" ON cities';
    EXECUTE 'CREATE POLICY "anon_all_cities" ON cities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- FAIXAS DE CEP
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'zip_code_ranges') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read zip codes" ON zip_code_ranges';
    EXECUTE 'CREATE POLICY "anon_all_zip_code_ranges" ON zip_code_ranges FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ==============================================================================
-- TABELAS DE CONFIGURAÇÃO/INTEGRAÇÕES
-- ==============================================================================

-- FERIADOS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'holidays') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage holidays" ON holidays';
    EXECUTE 'CREATE POLICY "anon_all_holidays" ON holidays FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- API KEYS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage api keys" ON api_keys';
    EXECUTE 'CREATE POLICY "anon_all_api_keys" ON api_keys FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- CONFIGURAÇÃO DE EMAIL
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_outgoing_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage email config" ON email_outgoing_config';
    EXECUTE 'CREATE POLICY "anon_all_email_config" ON email_outgoing_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- WHATSAPP
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage whatsapp config" ON whatsapp_config';
    EXECUTE 'CREATE POLICY "anon_all_whatsapp_config" ON whatsapp_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_transactions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view transactions" ON whatsapp_transactions';
    EXECUTE 'CREATE POLICY "anon_all_whatsapp_transactions" ON whatsapp_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- GOOGLE MAPS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'google_maps_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage google maps config" ON google_maps_config';
    EXECUTE 'CREATE POLICY "anon_all_google_maps_config" ON google_maps_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'google_maps_transactions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view google transactions" ON google_maps_transactions';
    EXECUTE 'CREATE POLICY "anon_all_google_maps_transactions" ON google_maps_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- OPENAI
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage openai config" ON openai_config';
    EXECUTE 'CREATE POLICY "anon_all_openai_config" ON openai_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_transactions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view openai transactions" ON openai_transactions';
    EXECUTE 'CREATE POLICY "anon_all_openai_transactions" ON openai_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ==============================================================================
-- TABELAS DE NPS
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nps_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage nps config" ON nps_config';
    EXECUTE 'CREATE POLICY "anon_all_nps_config" ON nps_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nps_surveys') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage nps surveys" ON nps_surveys';
    EXECUTE 'CREATE POLICY "anon_all_nps_surveys" ON nps_surveys FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nps_responses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view nps responses" ON nps_responses';
    EXECUTE 'CREATE POLICY "anon_all_nps_responses" ON nps_responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ==============================================================================
-- TABELAS DE SISTEMA
-- ==============================================================================

-- LICENÇAS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'licenses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view licenses" ON licenses';
    EXECUTE 'CREATE POLICY "anon_all_licenses" ON licenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- LOGS DE MUDANÇAS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'change_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view change logs" ON change_logs';
    EXECUTE 'CREATE POLICY "anon_all_change_logs" ON change_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- INOVAÇÕES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'innovations') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage innovations" ON innovations';
    EXECUTE 'CREATE POLICY "anon_all_innovations" ON innovations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- SUGESTÕES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'suggestions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage suggestions" ON suggestions';
    EXECUTE 'CREATE POLICY "anon_all_suggestions" ON suggestions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- WHITE LABEL
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'white_label_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage white label" ON white_label_config';
    EXECUTE 'CREATE POLICY "anon_all_white_label_config" ON white_label_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;
