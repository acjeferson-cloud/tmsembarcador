# Complete PostgreSQL Database Schema

## Files Generated

### 1. `full_schema.sql` (91KB, 2,106 lines)
Complete PostgreSQL schema file containing:
- **70 tables** with full column definitions, data types, defaults, and constraints
- **5 extensions** (uuid-ossp, pgcrypto, pg_stat_statements, pg_graphql, supabase_vault)
- **3 sequences** (cities_id_seq, freight_quotes_history_quote_number_seq, zip_code_ranges_id_seq)
- **73 indexes** for performance optimization
- **30 RLS policies** for multi-tenant data isolation
- **5 key functions** (session context, admin checks, timestamp updates)
- **19 triggers** for automation

### 2. `SCHEMA_SUMMARY.md`
Comprehensive documentation including table organization, features, usage examples, and maintenance guidelines.

## Quick Start

```bash
# Apply the schema
psql -h your-host -U your-user -d your-database -f full_schema.sql

# Verify installation
psql -h your-host -U your-user -d your-database -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
```

## All 70 Tables

1. api_keys_config
2. api_keys_rotation_history
3. bill_invoices
4. bills
5. business_partner_addresses
6. business_partner_contacts
7. business_partners
8. carriers
9. change_logs
10. cities
11. countries
12. ctes_carrier_costs
13. ctes_complete
14. ctes_invoices
15. deploy_executions
16. deploy_interpretations
17. deploy_projects
18. deploy_suggestions
19. deploy_uploads
20. deploy_validations
21. email_outgoing_config
22. environments
23. establishments
24. freight_quotes
25. freight_quotes_history
26. freight_rate_additional_fees
27. freight_rate_cities
28. freight_rate_details
29. freight_rate_restricted_items
30. freight_rate_tables
31. freight_rates
32. google_maps_config
33. holidays
34. innovations
35. invoices
36. invoices_nfe
37. invoices_nfe_carriers
38. invoices_nfe_customers
39. invoices_nfe_occurrences
40. invoices_nfe_products
41. license_logs
42. licenses
43. nps_avaliacoes_internas
44. nps_config
45. nps_historico_envios
46. nps_pesquisas_cliente
47. occurrences
48. openai_config
49. order_delivery_status
50. order_items
51. orders
52. organization_settings
53. organizations
54. pickups
55. rejection_reasons
56. reverse_logistics
57. reverse_logistics_items
58. saas_admin_users
59. saas_admins
60. saas_plans
61. states
62. suggestions
63. user_innovations
64. users
65. whatsapp_config
66. whatsapp_messages_log
67. whatsapp_templates
68. whatsapp_transactions
69. xml_auto_import_logs
70. zip_code_ranges

## Key Features

- **Multi-tenant architecture** with organization and environment isolation
- **Row Level Security (RLS)** for automatic data filtering
- **Brazilian compliance** (NF-e, CT-e, IBGE codes)
- **Freight management** with complex rate calculations
- **Order tracking** and delivery status
- **Carrier performance** with NPS tracking
- **API integrations** (Google Maps, OpenAI, WhatsApp)
- **Complete audit trail** with change logs

## Version

Generated: 2026-02-17
Schema Version: 1.0
Total Tables: 70
