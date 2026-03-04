# PostgreSQL Database Schema Summary

## Overview
Complete schema for a multi-tenant Transport Management System (TMS) with 70 tables.

**File:** `full_schema.sql`  
**Generated:** 2026-02-17  
**Size:** 91KB, 2,106 lines

## Statistics

- **Tables:** 70
- **Sequences:** 3
- **Extensions:** 5
- **Indexes:** 73
- **RLS Policies:** 30
- **Functions:** 5 (showing key functions, full database has 40+)
- **Triggers:** 19

## Schema Organization

### 1. Extensions
- uuid-ossp
- pgcrypto
- pg_stat_statements
- pg_graphql (Supabase)
- supabase_vault

### 2. Core SaaS Tables
- `saas_plans` - Subscription plans
- `saas_admins` - Platform administrators
- `saas_admin_users` - Admin user accounts
- `organizations` - Tenant organizations
- `environments` - Environment isolation (prod, staging, etc.)
- `organization_settings` - Per-organization configuration

### 3. Geography & Location
- `countries` - Country master data
- `states` - Brazilian states
- `cities` - City master data (with IBGE codes)
- `zip_code_ranges` - ZIP code to city mapping
- `holidays` - Holiday calendar (national, state, municipal)

### 4. User Management
- `users` - System users with RBAC
- `licenses` - License management
- `license_logs` - License activity audit
- `establishments` - Physical locations (headquarters, branches)

### 5. Business Partners
- `business_partners` - Customers and suppliers
- `business_partner_addresses` - Multiple addresses per partner
- `business_partner_contacts` - Contact persons

### 6. Carrier Management
- `carriers` - Transport carriers with NPS tracking
- `occurrences` - Delivery occurrence types
- `rejection_reasons` - Rejection reason codes

### 7. Freight Rate Management
- `freight_rate_tables` - Rate tables with validity periods
- `freight_rates` - Individual freight rates
- `freight_rate_details` - Rate calculation tiers (weight, volume)
- `freight_rate_cities` - City-specific rates and delivery times
- `freight_rate_additional_fees` - Additional charges
- `freight_rate_restricted_items` - Item restrictions (NCM, EAN)

### 8. Order Management
- `orders` - Transport orders
- `order_items` - Order line items
- `order_delivery_status` - Delivery tracking events
- `pickups` - Pickup requests
- `freight_quotes` - Freight quotations
- `freight_quotes_history` - Quote history with carrier comparison

### 9. Invoice Management
- `invoices` - Invoice master
- `bills` - Bill master
- `bill_invoices` - Bill-to-invoice relationship
- `invoices_nfe` - Brazilian electronic invoices (NF-e)
- `invoices_nfe_carriers` - Carrier data from NF-e
- `invoices_nfe_customers` - Customer data from NF-e
- `invoices_nfe_occurrences` - Occurrences linked to invoices
- `invoices_nfe_products` - Products from NF-e

### 10. CTE (Electronic Transport Document)
- `ctes_complete` - CT-e master data
- `ctes_invoices` - Invoices referenced in CT-e
- `ctes_carrier_costs` - Carrier cost breakdown

### 11. Reverse Logistics
- `reverse_logistics` - Return/exchange orders
- `reverse_logistics_items` - Items in reverse logistics

### 12. NPS (Net Promoter Score)
- `nps_config` - NPS calculation configuration
- `nps_avaliacoes_internas` - Internal carrier evaluations
- `nps_pesquisas_cliente` - Customer satisfaction surveys
- `nps_historico_envios` - Survey send history

### 13. Integration & Configuration
- `api_keys_config` - API key management with rotation
- `api_keys_rotation_history` - Key rotation audit trail
- `google_maps_config` - Google Maps API configuration
- `openai_config` - OpenAI API configuration
- `whatsapp_config` - WhatsApp API configuration
- `email_outgoing_config` - SMTP configuration per establishment

### 14. WhatsApp Integration
- `whatsapp_templates` - Message templates
- `whatsapp_messages_log` - Message delivery log
- `whatsapp_transactions` - Message transactions

### 15. Import & Export
- `xml_auto_import_logs` - Automated XML import tracking

### 16. Innovation & Feedback
- `innovations` - New feature announcements
- `user_innovations` - User-dismissed innovations
- `suggestions` - User suggestions with voting

### 17. Deployment Tracking
- `deploy_projects` - Deployment projects
- `deploy_uploads` - Uploaded deployment files
- `deploy_interpretations` - AI interpretation of deployments
- `deploy_suggestions` - Deployment suggestions
- `deploy_executions` - Execution results
- `deploy_validations` - Validation results

### 18. Audit & Logging
- `change_logs` - Complete audit trail with org/env isolation

## Key Features

### Multi-Tenancy
All tables include `organization_id` and `environment_id` for complete data isolation:
- Organizations can have multiple environments (production, staging, testing)
- Row Level Security (RLS) enforces isolation at the database level
- Session context functions (`get_session_organization_id()`, `get_session_environment_id()`)

### Security
- **RLS Policies:** All tenant-scoped tables have 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **Session Context:** Security definer functions for context management
- **API Key Rotation:** Automated key rotation with complete audit trail
- **Password Hashing:** Support for bcrypt, SHA-256, and plain text (legacy)

### Brazilian Compliance
- **NF-e Support:** Complete electronic invoice processing
- **CT-e Support:** Electronic transport document management
- **IBGE Codes:** Official Brazilian municipality codes
- **Tax Regimes:** Simples, Presumido, Real, MEI

### Performance
- 73 indexes covering:
  - Primary keys and foreign keys
  - Org/env isolation queries
  - Date-based lookups
  - Full-text search fields
  - GIN indexes for JSONB and array columns

### Automation
- 19 triggers for:
  - Automatic `updated_at` timestamp updates
  - API key rotation logging
  - Default establishment creation for new environments

## Usage Notes

### Applying the Schema
```bash
# Connect to your PostgreSQL database
psql -h your-host -U your-user -d your-database -f full_schema.sql
```

### Session Context Setup
Before querying tenant data, set session context:
```sql
SELECT set_session_context(
    'your-org-uuid'::uuid,
    'your-env-uuid'::uuid,
    'user@example.com'
);
```

### Querying with RLS
Once context is set, queries automatically filter by organization and environment:
```sql
-- Returns only orders for the current org/env
SELECT * FROM orders;

-- Returns only users for the current org/env
SELECT * FROM users WHERE status = 'ativo';
```

## Table Dependencies

Tables are ordered by dependencies in the schema file:

1. **Foundation:** saas_plans, organizations, environments
2. **Geography:** countries, states, cities, zip_code_ranges
3. **Core:** establishments, users, business_partners, carriers
4. **Rates:** freight_rate_tables → freight_rates → freight_rate_details/cities/fees
5. **Operations:** orders, invoices, bills, ctes_complete
6. **Relations:** order_items, bill_invoices, ctes_invoices
7. **Tracking:** order_delivery_status, reverse_logistics, nps_*
8. **Configuration:** *_config tables
9. **Logs:** change_logs, *_history, *_logs tables

## Maintenance

### Backup Recommendations
- Full backup: Daily
- Transaction log: Continuous
- Schema-only export: After migrations

### Index Maintenance
```sql
-- Reindex all tables (run during maintenance window)
REINDEX DATABASE your_database;

-- Analyze for query planner
ANALYZE;
```

### Monitoring
Key metrics to monitor:
- RLS policy performance
- Index usage (`pg_stat_user_indexes`)
- Table bloat
- Connection pool utilization
- Session context setup time

## Support

This schema supports:
- PostgreSQL 12+
- Supabase (optimized for Supabase features)
- Multi-tenant SaaS applications
- Brazilian transport & logistics operations
- High transaction volumes with proper indexing
- Complete audit trails
- API integrations (Google Maps, OpenAI, WhatsApp)

## Version History

- **2026-02-17:** Initial complete schema export with all 70 tables
