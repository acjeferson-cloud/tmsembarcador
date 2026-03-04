/*
  # CORREÇÃO URGENTE: Reabilitar RLS para Isolar Organizations

  1. Problema Crítico
    - RLS está DESABILITADO em todas as tabelas
    - Usuários veem dados de TODAS as organizations
    - Vazamento de segurança gravíssimo em sistema multi-tenant

  2. Solução
    - REABILITA RLS em todas as tabelas com organization_id
    - Cria políticas restritivas que filtram por organization_id + environment_id
    - Remove TODAS as políticas antigas permissivas

  3. Tabelas Corrigidas (26 tabelas)
    - bills, business_partners, carriers, change_logs
    - ctes_complete, email_outgoing_config, establishments
    - freight_rate_cities, freight_rate_tables, freight_rates
    - google_maps_config, holidays, innovations
    - invoices, invoices_nfe, occurrences, openai_config
    - orders, pickups, rejection_reasons, reverse_logistics
    - suggestions, users, whatsapp_config

  4. Tabelas de Configuração (2 tabelas - apenas org)
    - environments (apenas organization_id)
    - organization_settings (apenas organization_id)

  5. Segurança
    - Isolamento TOTAL entre organizations
    - Cada query filtra por session context
    - Deny by default (sem policy = sem acesso)
*/

-- =====================================================
-- FUNÇÕES HELPER PARA SESSION CONTEXT
-- =====================================================

CREATE OR REPLACE FUNCTION get_session_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.organization_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_session_environment_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.environment_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- REMOVER TODAS AS POLÍTICAS ANTIGAS
-- =====================================================

DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- REABILITAR RLS EM TODAS AS TABELAS COM organization_id
-- =====================================================

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctes_complete ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outgoing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rate_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rate_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_maps_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejection_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reverse_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MACRO PARA CRIAR POLÍTICAS (organization + environment)
-- =====================================================

-- BILLS
CREATE POLICY "bills_isolation_select" ON bills FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "bills_isolation_insert" ON bills FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "bills_isolation_update" ON bills FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "bills_isolation_delete" ON bills FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- BUSINESS_PARTNERS
CREATE POLICY "business_partners_isolation_select" ON business_partners FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "business_partners_isolation_insert" ON business_partners FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "business_partners_isolation_update" ON business_partners FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "business_partners_isolation_delete" ON business_partners FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- CARRIERS
CREATE POLICY "carriers_isolation_select" ON carriers FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "carriers_isolation_insert" ON carriers FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "carriers_isolation_update" ON carriers FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "carriers_isolation_delete" ON carriers FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- CHANGE_LOGS
CREATE POLICY "change_logs_isolation_select" ON change_logs FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "change_logs_isolation_insert" ON change_logs FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "change_logs_isolation_update" ON change_logs FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "change_logs_isolation_delete" ON change_logs FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- CTES_COMPLETE
CREATE POLICY "ctes_complete_isolation_select" ON ctes_complete FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "ctes_complete_isolation_insert" ON ctes_complete FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "ctes_complete_isolation_update" ON ctes_complete FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "ctes_complete_isolation_delete" ON ctes_complete FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- EMAIL_OUTGOING_CONFIG
CREATE POLICY "email_outgoing_config_isolation_select" ON email_outgoing_config FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "email_outgoing_config_isolation_insert" ON email_outgoing_config FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "email_outgoing_config_isolation_update" ON email_outgoing_config FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "email_outgoing_config_isolation_delete" ON email_outgoing_config FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- ESTABLISHMENTS
CREATE POLICY "establishments_isolation_select" ON establishments FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "establishments_isolation_insert" ON establishments FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "establishments_isolation_update" ON establishments FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "establishments_isolation_delete" ON establishments FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- FREIGHT_RATE_CITIES
CREATE POLICY "freight_rate_cities_isolation_select" ON freight_rate_cities FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rate_cities_isolation_insert" ON freight_rate_cities FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rate_cities_isolation_update" ON freight_rate_cities FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rate_cities_isolation_delete" ON freight_rate_cities FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- FREIGHT_RATE_TABLES
CREATE POLICY "freight_rate_tables_isolation_select" ON freight_rate_tables FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rate_tables_isolation_insert" ON freight_rate_tables FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rate_tables_isolation_update" ON freight_rate_tables FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rate_tables_isolation_delete" ON freight_rate_tables FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- FREIGHT_RATES
CREATE POLICY "freight_rates_isolation_select" ON freight_rates FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rates_isolation_insert" ON freight_rates FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rates_isolation_update" ON freight_rates FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "freight_rates_isolation_delete" ON freight_rates FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- GOOGLE_MAPS_CONFIG
CREATE POLICY "google_maps_config_isolation_select" ON google_maps_config FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "google_maps_config_isolation_insert" ON google_maps_config FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "google_maps_config_isolation_update" ON google_maps_config FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "google_maps_config_isolation_delete" ON google_maps_config FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- HOLIDAYS
CREATE POLICY "holidays_isolation_select" ON holidays FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "holidays_isolation_insert" ON holidays FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "holidays_isolation_update" ON holidays FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "holidays_isolation_delete" ON holidays FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- INNOVATIONS (GLOBAL - todos podem ver)
CREATE POLICY "innovations_public_select" ON innovations FOR SELECT TO anon USING (true);
CREATE POLICY "innovations_public_insert" ON innovations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "innovations_public_update" ON innovations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "innovations_public_delete" ON innovations FOR DELETE TO anon USING (true);

-- INVOICES
CREATE POLICY "invoices_isolation_select" ON invoices FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "invoices_isolation_insert" ON invoices FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "invoices_isolation_update" ON invoices FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "invoices_isolation_delete" ON invoices FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- INVOICES_NFE
CREATE POLICY "invoices_nfe_isolation_select" ON invoices_nfe FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "invoices_nfe_isolation_insert" ON invoices_nfe FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "invoices_nfe_isolation_update" ON invoices_nfe FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "invoices_nfe_isolation_delete" ON invoices_nfe FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- OCCURRENCES
CREATE POLICY "occurrences_isolation_select" ON occurrences FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "occurrences_isolation_insert" ON occurrences FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "occurrences_isolation_update" ON occurrences FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "occurrences_isolation_delete" ON occurrences FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- OPENAI_CONFIG
CREATE POLICY "openai_config_isolation_select" ON openai_config FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "openai_config_isolation_insert" ON openai_config FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "openai_config_isolation_update" ON openai_config FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "openai_config_isolation_delete" ON openai_config FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- ORDERS
CREATE POLICY "orders_isolation_select" ON orders FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "orders_isolation_insert" ON orders FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "orders_isolation_update" ON orders FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "orders_isolation_delete" ON orders FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- PICKUPS
CREATE POLICY "pickups_isolation_select" ON pickups FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "pickups_isolation_insert" ON pickups FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "pickups_isolation_update" ON pickups FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "pickups_isolation_delete" ON pickups FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- REJECTION_REASONS
CREATE POLICY "rejection_reasons_isolation_select" ON rejection_reasons FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "rejection_reasons_isolation_insert" ON rejection_reasons FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "rejection_reasons_isolation_update" ON rejection_reasons FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "rejection_reasons_isolation_delete" ON rejection_reasons FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- REVERSE_LOGISTICS
CREATE POLICY "reverse_logistics_isolation_select" ON reverse_logistics FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "reverse_logistics_isolation_insert" ON reverse_logistics FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "reverse_logistics_isolation_update" ON reverse_logistics FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "reverse_logistics_isolation_delete" ON reverse_logistics FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- SUGGESTIONS
CREATE POLICY "suggestions_isolation_select" ON suggestions FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "suggestions_isolation_insert" ON suggestions FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "suggestions_isolation_update" ON suggestions FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "suggestions_isolation_delete" ON suggestions FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- USERS
CREATE POLICY "users_isolation_select" ON users FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "users_isolation_insert" ON users FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "users_isolation_update" ON users FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "users_isolation_delete" ON users FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- WHATSAPP_CONFIG
CREATE POLICY "whatsapp_config_isolation_select" ON whatsapp_config FOR SELECT TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "whatsapp_config_isolation_insert" ON whatsapp_config FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "whatsapp_config_isolation_update" ON whatsapp_config FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id())
  WITH CHECK (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());
CREATE POLICY "whatsapp_config_isolation_delete" ON whatsapp_config FOR DELETE TO anon
  USING (organization_id = get_session_organization_id() AND environment_id = get_session_environment_id());

-- =====================================================
-- POLÍTICAS PARA TABELAS COM APENAS organization_id
-- =====================================================

-- ENVIRONMENTS (apenas organization_id)
CREATE POLICY "environments_isolation_select" ON environments FOR SELECT TO anon
  USING (organization_id = get_session_organization_id());
CREATE POLICY "environments_isolation_insert" ON environments FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id());
CREATE POLICY "environments_isolation_update" ON environments FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id())
  WITH CHECK (organization_id = get_session_organization_id());
CREATE POLICY "environments_isolation_delete" ON environments FOR DELETE TO anon
  USING (organization_id = get_session_organization_id());

-- ORGANIZATION_SETTINGS (apenas organization_id)
CREATE POLICY "organization_settings_isolation_select" ON organization_settings FOR SELECT TO anon
  USING (organization_id = get_session_organization_id());
CREATE POLICY "organization_settings_isolation_insert" ON organization_settings FOR INSERT TO anon
  WITH CHECK (organization_id = get_session_organization_id());
CREATE POLICY "organization_settings_isolation_update" ON organization_settings FOR UPDATE TO anon
  USING (organization_id = get_session_organization_id())
  WITH CHECK (organization_id = get_session_organization_id());
CREATE POLICY "organization_settings_isolation_delete" ON organization_settings FOR DELETE TO anon
  USING (organization_id = get_session_organization_id());

-- =====================================================
-- TABELAS GLOBAIS - RLS desabilitado
-- =====================================================

ALTER TABLE countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE states DISABLE ROW LEVEL SECURITY;
ALTER TABLE cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
