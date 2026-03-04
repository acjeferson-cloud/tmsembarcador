-- Full PostgreSQL Database Schema
-- Generated on: 2026-02-17 21:35:21.298687
-- Total tables: 70

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- SEQUENCES
-- ============================================

CREATE SEQUENCE IF NOT EXISTS cities_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS freight_quotes_history_quote_number_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS zip_code_ranges_id_seq START 1 INCREMENT 1;

-- ============================================
-- TABLES
-- ============================================
-- Note: Complete table definitions will be queried from database

-- Table: api_keys_config
-- (Structure to be queried)

-- Table: api_keys_rotation_history
-- (Structure to be queried)

-- Table: bill_invoices
-- (Structure to be queried)

-- Table: bills
-- (Structure to be queried)

-- Table: business_partner_addresses
-- (Structure to be queried)

-- Table: business_partner_contacts
-- (Structure to be queried)

-- Table: business_partners
-- (Structure to be queried)

-- Table: carriers
-- (Structure to be queried)

-- Table: change_logs
-- (Structure to be queried)

-- Table: cities
-- (Structure to be queried)

-- Table: countries
-- (Structure to be queried)

-- Table: ctes_carrier_costs
-- (Structure to be queried)

-- Table: ctes_complete
-- (Structure to be queried)

-- Table: ctes_invoices
-- (Structure to be queried)

-- Table: deploy_executions
-- (Structure to be queried)

-- Table: deploy_interpretations
-- (Structure to be queried)

-- Table: deploy_projects
-- (Structure to be queried)

-- Table: deploy_suggestions
-- (Structure to be queried)

-- Table: deploy_uploads
-- (Structure to be queried)

-- Table: deploy_validations
-- (Structure to be queried)

-- Table: email_outgoing_config
-- (Structure to be queried)

-- Table: environments
-- (Structure to be queried)

-- Table: establishments
-- (Structure to be queried)

-- Table: freight_quotes
-- (Structure to be queried)

-- Table: freight_quotes_history
-- (Structure to be queried)

-- Table: freight_rate_additional_fees
-- (Structure to be queried)

-- Table: freight_rate_cities
-- (Structure to be queried)

-- Table: freight_rate_details
-- (Structure to be queried)

-- Table: freight_rate_restricted_items
-- (Structure to be queried)

-- Table: freight_rate_tables
-- (Structure to be queried)

-- Table: freight_rates
-- (Structure to be queried)

-- Table: google_maps_config
-- (Structure to be queried)

-- Table: holidays
-- (Structure to be queried)

-- Table: innovations
-- (Structure to be queried)

-- Table: invoices
-- (Structure to be queried)

-- Table: invoices_nfe
-- (Structure to be queried)

-- Table: invoices_nfe_carriers
-- (Structure to be queried)

-- Table: invoices_nfe_customers
-- (Structure to be queried)

-- Table: invoices_nfe_occurrences
-- (Structure to be queried)

-- Table: invoices_nfe_products
-- (Structure to be queried)

-- Table: license_logs
-- (Structure to be queried)

-- Table: licenses
-- (Structure to be queried)

-- Table: nps_avaliacoes_internas
-- (Structure to be queried)

-- Table: nps_config
-- (Structure to be queried)

-- Table: nps_historico_envios
-- (Structure to be queried)

-- Table: nps_pesquisas_cliente
-- (Structure to be queried)

-- Table: occurrences
-- (Structure to be queried)

-- Table: openai_config
-- (Structure to be queried)

-- Table: order_delivery_status
-- (Structure to be queried)

-- Table: order_items
-- (Structure to be queried)

-- Table: orders
-- (Structure to be queried)

-- Table: organization_settings
-- (Structure to be queried)

-- Table: organizations
-- (Structure to be queried)

-- Table: pickups
-- (Structure to be queried)

-- Table: rejection_reasons
-- (Structure to be queried)

-- Table: reverse_logistics
-- (Structure to be queried)

-- Table: reverse_logistics_items
-- (Structure to be queried)

-- Table: saas_admin_users
-- (Structure to be queried)

-- Table: saas_admins
-- (Structure to be queried)

-- Table: saas_plans
-- (Structure to be queried)

-- Table: states
-- (Structure to be queried)

-- Table: suggestions
-- (Structure to be queried)

-- Table: user_innovations
-- (Structure to be queried)

-- Table: users
-- (Structure to be queried)

-- Table: whatsapp_config
-- (Structure to be queried)

-- Table: whatsapp_messages_log
-- (Structure to be queried)

-- Table: whatsapp_templates
-- (Structure to be queried)

-- Table: whatsapp_transactions
-- (Structure to be queried)

-- Table: xml_auto_import_logs
-- (Structure to be queried)

-- Table: zip_code_ranges
-- (Structure to be queried)

