-- ============================================
-- CLOUD SQL DATA MIGRATION - UPDATE SCRIPTS
-- Generated: 2026-02-17
-- Purpose: Update existing records with organization_id and environment_id
-- ============================================
--
-- IMPORTANT NOTES:
-- ============================================
--
-- 1. These UPDATEs are designed to populate organization_id and environment_id
--    columns in existing data that was created before multi-tenant implementation.
--
-- 2. Default Organization and Environment:
--    - Organization: "Demonstração" (8b007dd0-0db6-4288-a1c1-7b05ffb7b32e)
--    - Environment: "Produção" (abe69012-4449-4946-977e-46af45790a43)
--
-- 3. This script uses the FIRST organization and environment as default.
--    Adjust the UUIDs if your data should belong to a different org/env.
--
-- 4. Before running on Cloud SQL:
--    - Backup your database
--    - Test on a staging environment first
--    - Review and adjust organization_id/environment_id values as needed
--
-- 5. Tables Updated: 47 tables with existing data
--
-- ============================================
-- REFERENCE DATA
-- ============================================

-- Organizations available:
-- 8b007dd0-0db6-4288-a1c1-7b05ffb7b32e | Demonstração
-- ac730ac4-2f10-4fb6-acc3-8325cb51ebc6 | Segundo cliente
-- 4ca4fdaa-5f55-48be-9195-3bc14413cb06 | Quimidrol Comércio Indústria Importação LTDA

-- Environments available:
-- abe69012-4449-4946-977e-46af45790a43 | Produção (Demonstração)
-- 68d4e9f6-2a75-4b30-a660-721de45faedd | Produção (Segundo cliente)
-- 07f23b7e-471d-4968-a5fe-fd388e739780 | Produção (Quimidrol)
-- ab23dd7f-42a4-4e55-b340-45433f842337 | Sandbox (Demonstração)
-- dfd414bd-8d08-4a4d-81e5-c59f51c7863a | Homologação (Quimidrol)

-- ============================================
-- SECTION 1: CORE CONFIGURATION TABLES
-- ============================================

-- Update saas_plans (4 records)
-- Plans are global, but need organization_id for RLS
UPDATE saas_plans
SET organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
WHERE organization_id IS NULL;

-- Update saas_admins (1 record)
UPDATE saas_admins
SET organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
WHERE organization_id IS NULL;

-- Update saas_admin_users (1 record)
UPDATE saas_admin_users
SET organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
WHERE organization_id IS NULL;

-- Update organization_settings (3 records)
-- These already have organization_id, but need environment_id
UPDATE organization_settings
SET environment_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'
WHERE environment_id IS NULL;

-- ============================================
-- SECTION 2: GEOGRAPHY TABLES
-- ============================================

-- Update countries (196 records)
UPDATE countries
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update states (27 records)
UPDATE states
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update cities (40 records)
UPDATE cities
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update zip_code_ranges (369 records)
UPDATE zip_code_ranges
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update holidays (24 records)
UPDATE holidays
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 3: USER MANAGEMENT
-- ============================================

-- Update establishments (7 records)
UPDATE establishments
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update users (15 records)
UPDATE users
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update licenses (1 record)
UPDATE licenses
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update license_logs (21 records)
UPDATE license_logs
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 4: BUSINESS PARTNERS
-- ============================================

-- Update business_partners (14 records)
UPDATE business_partners
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update business_partner_addresses (14 records)
UPDATE business_partner_addresses
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update business_partner_contacts (46 records)
UPDATE business_partner_contacts
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 5: CARRIERS
-- ============================================

-- Update carriers (12 records)
UPDATE carriers
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update occurrences (68 records)
UPDATE occurrences
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update rejection_reasons (46 records)
UPDATE rejection_reasons
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 6: FREIGHT RATES
-- ============================================

-- Update freight_rate_tables (5 records)
UPDATE freight_rate_tables
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update freight_rates (11 records)
UPDATE freight_rates
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update freight_rate_details (88 records)
UPDATE freight_rate_details
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update freight_rate_cities (9 records)
UPDATE freight_rate_cities
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 7: ORDERS
-- ============================================

-- Update orders (102 records)
UPDATE orders
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update order_items (19 records)
UPDATE order_items
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update order_delivery_status (8 records)
UPDATE order_delivery_status
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update pickups (11 records)
UPDATE pickups
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update freight_quotes_history (70 records)
UPDATE freight_quotes_history
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 8: INVOICES & BILLS
-- ============================================

-- Update invoices (12 records)
UPDATE invoices
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update invoices_nfe (235 records)
UPDATE invoices_nfe
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update bills (11 records)
UPDATE bills
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 9: CTE (TRANSPORT DOCUMENTS)
-- ============================================

-- Update ctes_complete (192 records)
UPDATE ctes_complete
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 10: REVERSE LOGISTICS
-- ============================================

-- Update reverse_logistics (30 records)
UPDATE reverse_logistics
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 11: NPS SYSTEM
-- ============================================

-- Update nps_config (1 record)
UPDATE nps_config
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update nps_pesquisas_cliente (69 records)
UPDATE nps_pesquisas_cliente
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update nps_avaliacoes_internas (24 records)
UPDATE nps_avaliacoes_internas
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 12: API KEYS
-- ============================================

-- Update api_keys_config (6 records)
UPDATE api_keys_config
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 13: INTEGRATIONS CONFIG
-- ============================================

-- Update email_outgoing_config (1 record)
UPDATE email_outgoing_config
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update google_maps_config (4 records)
UPDATE google_maps_config
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update openai_config (4 records)
UPDATE openai_config
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update whatsapp_config (3 records)
UPDATE whatsapp_config
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update whatsapp_templates (7 records)
UPDATE whatsapp_templates
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 14: AUDIT & LOGS
-- ============================================

-- Update change_logs (20 records)
UPDATE change_logs
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update xml_auto_import_logs (11 records)
UPDATE xml_auto_import_logs
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 15: INNOVATION & FEEDBACK
-- ============================================

-- Update innovations (6 records)
UPDATE innovations
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- Update user_innovations (6 records)
UPDATE user_innovations
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- SECTION 16: DEPLOYMENT TRACKING
-- ============================================

-- Update deploy_projects (1 record)
UPDATE deploy_projects
SET
  organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  environment_id = 'abe69012-4449-4946-977e-46af45790a43'
WHERE organization_id IS NULL OR environment_id IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries after executing the updates to verify:

-- 1. Check tables still missing organization_id
SELECT
  schemaname,
  relname as tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_live_tup > 0
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = pg_stat_user_tables.relname
      AND column_name = 'organization_id'
  )
ORDER BY n_live_tup DESC;

-- 2. Count records by organization after update
SELECT
  o.name as organization,
  COUNT(*) as total_orders
FROM orders ord
JOIN organizations o ON o.id = ord.organization_id
GROUP BY o.id, o.name
ORDER BY total_orders DESC;

-- 3. Verify all tables have organization_id populated
SELECT
  t.tablename,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as null_count,
  COUNT(*) as total_count
FROM pg_tables t
JOIN LATERAL (
  SELECT organization_id FROM ONLY t.tablename LIMIT 1000
) data ON true
WHERE t.schemaname = 'public'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = t.tablename
      AND c.column_name = 'organization_id'
  )
GROUP BY t.tablename
HAVING COUNT(*) FILTER (WHERE organization_id IS NULL) > 0;

-- ============================================
-- SUMMARY
-- ============================================
--
-- Total Tables Updated: 47
-- Total Records Affected: ~1,859 records
--
-- Tables by Section:
-- - Core Configuration: 4 tables (10 records)
-- - Geography: 5 tables (656 records)
-- - User Management: 4 tables (44 records)
-- - Business Partners: 3 tables (74 records)
-- - Carriers: 3 tables (126 records)
-- - Freight Rates: 4 tables (113 records)
-- - Orders: 5 tables (210 records)
-- - Invoices & Bills: 3 tables (258 records)
-- - CTE: 1 table (192 records)
-- - Reverse Logistics: 1 table (30 records)
-- - NPS: 3 tables (94 records)
-- - API Keys: 1 table (6 records)
-- - Integrations: 5 tables (19 records)
-- - Audit & Logs: 2 tables (31 records)
-- - Innovation: 2 tables (12 records)
-- - Deployment: 1 table (1 record)
--
-- ============================================
-- EXECUTION CHECKLIST
-- ============================================
--
-- [ ] 1. Backup database before running
-- [ ] 2. Review organization_id and environment_id values
-- [ ] 3. Test on staging environment first
-- [ ] 4. Execute this script on Cloud SQL
-- [ ] 5. Run verification queries
-- [ ] 6. Check application functionality
-- [ ] 7. Monitor for RLS policy issues
-- [ ] 8. Document any manual adjustments needed
--
-- ============================================
