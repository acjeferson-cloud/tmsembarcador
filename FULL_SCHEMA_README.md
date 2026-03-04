# Full Database Schema - Complete Documentation

## Overview

This document describes the complete PostgreSQL schema for the TMS (Transport Management System) with **70 tables** covering all aspects of freight management, invoicing, carrier management, and multi-tenant SaaS operations.

## Files Generated

### 1. `full_schema.sql` (91KB, 2,106 lines)
**Complete production-ready PostgreSQL schema** containing:
- All 70 tables with complete structure
- All columns with data types, defaults, and constraints
- All primary keys and unique constraints
- All foreign key relationships (maintaining referential integrity)
- All indexes (73 total) for query optimization
- All sequences (3 total)
- All extensions (5 total)
- RLS policies (30 policies) for multi-tenant data isolation
- Functions (5 key functions) for session context and automation
- Triggers (19 triggers) for automatic timestamp updates
- Table comments for documentation

### 2. `SCHEMA_SUMMARY.md` (7.8KB)
Detailed technical documentation including:
- Complete list of all tables organized by functional area
- Index listing and usage
- RLS policy descriptions
- Function definitions
- Trigger mappings
- Foreign key relationships
- Best practices and usage examples

### 3. `README.md` (3.0KB)
Quick reference guide with:
- Table categories and grouping
- Key features overview
- Version information
- Getting started instructions

## Complete Table List (70 Tables)

### SaaS & Multi-Tenant (6 tables)
1. `saas_plans` - Subscription plans
2. `saas_admins` - Platform administrators
3. `saas_admin_users` - Admin accounts
4. `organizations` - Tenant organizations
5. `environments` - Environment isolation (prod/staging)
6. `organization_settings` - Organization config

### Geography & Location (5 tables)
7. `countries` - Country master data
8. `states` - Brazilian states
9. `cities` - City master with IBGE codes
10. `zip_code_ranges` - ZIP to city mapping
11. `holidays` - Holiday calendar

### User Management (4 tables)
12. `users` - System users with RBAC
13. `licenses` - License management
14. `license_logs` - License audit trail
15. `establishments` - Physical locations

### Business Partners (3 tables)
16. `business_partners` - Customers/suppliers
17. `business_partner_addresses` - Multiple addresses
18. `business_partner_contacts` - Contact persons

### Carrier Management (3 tables)
19. `carriers` - Transport carriers with NPS
20. `occurrences` - Delivery occurrence types
21. `rejection_reasons` - Rejection codes

### Freight Rates (6 tables)
22. `freight_rate_tables` - Rate tables
23. `freight_rates` - Individual rates
24. `freight_rate_details` - Rate tiers (weight/volume)
25. `freight_rate_cities` - City-specific rates
26. `freight_rate_additional_fees` - Additional charges
27. `freight_rate_restricted_items` - Item restrictions

### Order Management (6 tables)
28. `orders` - Transport orders
29. `order_items` - Order line items
30. `order_delivery_status` - Tracking events
31. `pickups` - Pickup requests
32. `freight_quotes` - Freight quotations
33. `freight_quotes_history` - Quote history

### Invoice & Billing (4 tables)
34. `invoices` - Invoice master
35. `bills` - Bill master
36. `bill_invoices` - Bill-invoice relationship
37. `invoices_nfe` - Brazilian NF-e master

### Brazilian NF-e (5 tables)
38. `invoices_nfe` - Electronic invoice master
39. `invoices_nfe_carriers` - Carrier info from NF-e
40. `invoices_nfe_customers` - Customer info from NF-e
41. `invoices_nfe_products` - Product details from NF-e
42. `invoices_nfe_occurrences` - NF-e delivery events

### Brazilian CT-e (3 tables)
43. `ctes_complete` - Electronic transport documents
44. `ctes_invoices` - CT-e to invoice relationship
45. `ctes_carrier_costs` - Carrier cost details

### Reverse Logistics (2 tables)
46. `reverse_logistics` - Return orders
47. `reverse_logistics_items` - Return items

### NPS System (4 tables)
48. `nps_config` - NPS configuration
49. `nps_pesquisas_cliente` - Customer surveys
50. `nps_avaliacoes_internas` - Internal ratings
51. `nps_historico_envios` - Email send history

### API & Integration (2 tables)
52. `api_keys_config` - API key management
53. `api_keys_rotation_history` - Key rotation log

### Configuration (5 tables)
54. `email_outgoing_config` - Email settings
55. `google_maps_config` - Google Maps API
56. `openai_config` - OpenAI integration
57. `whatsapp_config` - WhatsApp integration
58. `whatsapp_templates` - WhatsApp message templates

### Communication (2 tables)
59. `whatsapp_messages_log` - Message log
60. `whatsapp_transactions` - WhatsApp API usage

### Audit & Logging (3 tables)
61. `change_logs` - System change audit
62. `xml_auto_import_logs` - XML import tracking
63. `license_logs` - License activity (already counted)

### Innovation & Feedback (3 tables)
64. `innovations` - Innovation tracking
65. `user_innovations` - User innovation votes
66. `suggestions` - User suggestions

### Deployment Tracking (6 tables)
67. `deploy_projects` - Deployment projects
68. `deploy_uploads` - Code uploads
69. `deploy_interpretations` - Code analysis
70. `deploy_validations` - Validation results
71. `deploy_executions` - Execution logs
72. `deploy_suggestions` - Improvement suggestions

## Key Features

### 1. Multi-Tenant Architecture
- **Organizations:** Top-level tenant isolation
- **Environments:** Production, staging, development per organization
- **RLS Policies:** Automatic data filtering based on organization + environment
- **Session Context:** `set_session_context()` function for RLS enforcement

### 2. Brazilian Compliance
- **NF-e Support:** Complete electronic invoice structure
- **CT-e Support:** Electronic transport documents
- **IBGE Codes:** City identification per Brazilian standards
- **Tax Regimes:** Simples Nacional, Lucro Presumido, Lucro Real
- **Holiday Calendar:** National, state, and municipal holidays

### 3. Freight Management
- **Multi-dimensional Rates:** Weight, volume, declared value
- **City-specific Pricing:** Different rates and delivery times per route
- **Additional Fees:** Toll, insurance, handling, urgency
- **Restricted Items:** NCM and EAN-based restrictions
- **Quote History:** Automatic carrier comparison

### 4. Carrier Performance
- **NPS Tracking:** Net Promoter Score for carriers
- **Occurrence Management:** Delivery exceptions tracking
- **Cost Analysis:** Budget vs actual cost comparison
- **SLA Monitoring:** Delivery time compliance

### 5. Order Tracking
- **Status Timeline:** Complete delivery status history
- **Real-time Updates:** Event-driven status changes
- **Pickup Management:** Schedule and track pickups
- **Proof of Delivery:** Signature and photo capture

### 6. Integration Ready
- **API Key Management:** Automatic rotation with history
- **WhatsApp Integration:** Template-based messaging
- **Google Maps:** Geocoding and routing
- **OpenAI:** AI-powered features
- **Email Notifications:** Configurable SMTP per establishment

### 7. Security & Compliance
- **Row Level Security (RLS):** 30 policies for data isolation
- **Role-Based Access (RBAC):** Fine-grained permissions per user
- **Audit Trail:** Complete change log tracking
- **License Management:** User license control and monitoring
- **Password Security:** SHA-256 hashing with pgcrypto

### 8. Performance Optimization
- **73 Strategic Indexes:** Covering frequent queries
- **Sequence Management:** Auto-incrementing IDs where needed
- **Automatic Timestamps:** Triggers for updated_at columns
- **JSONB Fields:** Flexible metadata storage with indexing

## Database Requirements

- **PostgreSQL:** Version 12 or higher (tested on PostgreSQL 15)
- **Supabase:** Compatible with Supabase PostgreSQL
- **Extensions Required:**
  - `uuid-ossp` - UUID generation
  - `pgcrypto` - Password hashing
  - `pg_stat_statements` - Query statistics
  - `pg_graphql` - GraphQL support (Supabase)
  - `supabase_vault` - Secret management (Supabase)

## How to Use

### Option 1: Fresh Database
```bash
# Create a new database
createdb tms_production

# Apply the complete schema
psql -d tms_production -f full_schema.sql
```

### Option 2: Supabase
```sql
-- Execute in Supabase SQL Editor
-- Copy and paste full_schema.sql content
```

### Option 3: Migration from Existing
```bash
# Backup existing database first
pg_dump -d existing_db > backup.sql

# Compare schemas
pg_dump -s -d existing_db > existing_schema.sql
diff existing_schema.sql full_schema.sql

# Apply differences manually
```

## Important Notes

### RLS Policies
All tables with `organization_id` and `environment_id` have RLS enabled. To query data:

```sql
-- Set session context first
SELECT set_session_context(
  'user-uuid',
  'organization-uuid',
  'environment-uuid',
  'establishment-code'
);

-- Then queries will automatically filter by context
SELECT * FROM orders; -- Only sees orders in context
```

### Foreign Key Constraints
The schema maintains referential integrity. When deleting records:
- Use `CASCADE` carefully (some FKs use CASCADE, others RESTRICT)
- Check dependencies before deletion
- Consider soft deletes (is_active flags) instead

### Indexes
73 indexes are created for common query patterns:
- Primary keys (automatically indexed)
- Foreign keys (for join performance)
- Status + date combinations (for dashboards)
- Search fields (names, codes, numbers)
- RLS filter columns (organization_id, environment_id)

## Maintenance

### Regular Tasks
```sql
-- Analyze tables for query planner
ANALYZE;

-- Rebuild indexes if needed
REINDEX DATABASE your_database_name;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitoring
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check constraints
SELECT * FROM information_schema.table_constraints
WHERE table_schema = 'public';

-- Check indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

## Version History

- **v1.0** (2026-02-17): Initial complete schema generation
  - 70 tables
  - Multi-tenant architecture
  - Brazilian compliance (NF-e, CT-e)
  - Complete RLS policies
  - Production-ready

## Support

For questions or issues:
1. Check `SCHEMA_SUMMARY.md` for detailed table documentation
2. Review RLS policies if data access issues occur
3. Verify session context is set correctly
4. Check foreign key constraints for deletion errors

## License

This schema is part of the TMS Embarcador Smart Log project.

---

**Generated:** 2026-02-17
**Database:** PostgreSQL 15 / Supabase
**Tables:** 70
**Size:** 91KB (SQL file)
**Status:** Production Ready ✅
