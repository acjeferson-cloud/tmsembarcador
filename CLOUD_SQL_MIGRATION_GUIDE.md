# Google Cloud SQL Migration Guide

## Overview

This document describes the migration from Supabase PostgreSQL to Google Cloud SQL PostgreSQL 15+.

## Files

- **Original Schema**: `full_schema.sql` (Supabase PostgreSQL)
- **Cloud SQL Schema**: `full_schema_cloudsql.sql` (Google Cloud SQL Compatible)

## Schema Statistics

| Component | Count | Status |
|-----------|-------|--------|
| Tables | 70 | ✓ All preserved |
| Sequences | 3 | ✓ All preserved |
| Indexes | 73 | ✓ All preserved |
| Triggers | 19 | ✓ All preserved |
| Functions | 5 | ✓ Modified (see below) |
| Extensions | 3 | ✓ Modified (see below) |

## Key Changes Made

### 1. Extensions

**Removed** (Supabase-specific):
- `pg_graphql` - GraphQL extension specific to Supabase
- `supabase_vault` - Secrets management specific to Supabase

**Kept** (Standard PostgreSQL):
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions
- `pg_stat_statements` - Query performance statistics

**Schema Change**:
```sql
-- Before (Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- After (Cloud SQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Authentication References

All references to Supabase's `auth.users` table have been **commented out**:

**Affected Tables** (Foreign Keys Commented):
- `countries` (created_by, updated_by)
- `states` (created_by, updated_by)
- `carriers` (created_by, updated_by)
- `occurrences` (created_by, updated_by)
- `rejection_reasons` (created_by, updated_by)
- `invoices_nfe` (created_by, updated_by)
- `invoices_nfe_occurrences` (responsible_user_id)

**Example Change**:
```sql
-- Foreign key constraint commented out:
-- ADD CONSTRAINT countries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) -- REMOVED: Supabase auth.users not available in Cloud SQL
```

### 3. Functions Modified

#### `is_saas_admin()`
- Original implementation relied on `auth.users` and `auth.uid()`
- Modified to return `false` by default
- Includes commented original implementation for reference
- **Action Required**: Implement custom authentication logic

**Modified Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- REMOVED: Supabase-specific auth.users and auth.uid()
    -- Implement custom authentication logic here
    RETURN false;
END;
$$;
```

#### Other Functions (Preserved)
- `get_session_organization_id()` - Uses standard `current_setting()`
- `get_session_environment_id()` - Uses standard `current_setting()`
- `is_global_admin_user()` - Uses custom `users` table (no changes needed)
- `update_updated_at_column()` - Standard trigger function (no changes needed)

### 4. Row Level Security (RLS)

**Status**: Preserved but requires custom authentication

RLS policies are maintained and use standard PostgreSQL session variables via `current_setting()`:
- `app.organization_id`
- `app.environment_id`

**Application Integration Required**:
```sql
-- Set session variables in your application before queries:
SET LOCAL app.organization_id = 'uuid-value';
SET LOCAL app.environment_id = 'uuid-value';
```

### 5. All Database Objects Preserved

**Tables** (70 total):
- SaaS Foundation: `saas_plans`, `organizations`, `environments`, `organization_settings`
- User Management: `users`, `establishments`, `licenses`, `saas_admins`
- Geography: `countries`, `states`, `cities`, `zip_code_ranges`, `holidays`
- Business: `business_partners`, `business_partner_addresses`, `business_partner_contacts`
- Carriers: `carriers`, `occurrences`, `rejection_reasons`
- Freight: `freight_rate_tables`, `freight_rates`, `freight_quotes`, `freight_quotes_history`
- Orders: `orders`, `order_items`, `order_occurrences`, `order_status_history`
- Invoices: `invoices`, `invoices_nfe`, `invoices_nfe_carriers`, `invoices_nfe_occurrences`, `invoices_nfe_products`, etc.
- CTe: `ctes_complete`, `ctes_modal_rodoviario`, `ctes_destinatario`, etc.
- Bills: `bills`, `bills_products`, `bill_payment_installments`
- NPS: `nps_config`, `nps_responses`
- WhatsApp: `whatsapp_config`, `whatsapp_sessions`, `whatsapp_messages`, etc.
- API: `api_keys_config`, `api_key_rotation_logs`
- Misc: `deployments`, `suggestions`, `email_outgoing_config`

**All structural elements maintained**:
- Primary keys
- Unique constraints
- Foreign keys (except auth.users references)
- Check constraints
- Default values
- Indexes
- Triggers
- Sequences

## Cloud SQL Configuration Recommendations

### Instance Tier Selection
Choose based on your workload:
- **Development/Testing**: db-g1-small (1.7 GB RAM)
- **Production (Small)**: db-custom-2-8192 (2 vCPU, 8 GB RAM)
- **Production (Medium)**: db-custom-4-16384 (4 vCPU, 16 GB RAM)
- **Production (Large)**: db-custom-8-32768 (8 vCPU, 32 GB RAM)

### Recommended Database Flags

```bash
gcloud sql instances patch YOUR_INSTANCE_NAME \
  --database-flags=\
max_connections=200,\
shared_buffers=2GB,\
effective_cache_size=6GB,\
maintenance_work_mem=512MB,\
work_mem=16MB,\
random_page_cost=1.1,\
effective_io_concurrency=200,\
default_statistics_target=100,\
wal_buffers=16MB,\
checkpoint_completion_target=0.9,\
max_wal_size=4GB,\
min_wal_size=1GB,\
log_min_duration_statement=1000,\
log_connections=on,\
log_disconnections=on
```

### Connection Pooling

**Recommended: PgBouncer**
```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
your_db = host=CLOUD_SQL_IP port=5432 dbname=your_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

**Alternative: Cloud SQL Proxy**
```bash
# Download and run Cloud SQL Proxy
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE
```

## Migration Steps

### 1. Create Cloud SQL Instance

```bash
gcloud sql instances create YOUR_INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-custom-4-16384 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4
```

### 2. Create Database

```bash
gcloud sql databases create your_database_name \
  --instance=YOUR_INSTANCE_NAME
```

### 3. Apply Database Flags

```bash
# Apply the recommended flags (see above section)
```

### 4. Connect to Database

```bash
# Using Cloud SQL Proxy
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE &

# Connect with psql
psql "host=127.0.0.1 port=5432 dbname=your_database_name user=postgres"
```

### 5. Run Migration Script

```bash
# Load the schema
psql "host=127.0.0.1 port=5432 dbname=your_database_name user=postgres" \
  -f full_schema_cloudsql.sql
```

### 6. Verify Migration

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 70

-- Check extensions
SELECT * FROM pg_extension;
-- Expected: uuid-ossp, pgcrypto, pg_stat_statements

-- Check functions
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- Check triggers
SELECT tgname FROM pg_trigger JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE pg_class.relnamespace = 'public'::regnamespace;
```

## Post-Migration Tasks

### 1. Implement Custom Authentication

You need to implement custom authentication since Supabase's `auth.users` is not available.

**Options**:

#### Option A: Cloud Identity Platform
```javascript
// Integrate with Firebase Auth / Identity Platform
import { getAuth } from 'firebase/auth';
// Store user_id in session variables
```

#### Option B: Custom Auth Table
```sql
-- Create custom auth table
CREATE TABLE public.auth_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Re-enable foreign keys
ALTER TABLE public.countries
    ADD CONSTRAINT countries_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth_users(id);
```

#### Option C: Application-Level Validation
- Remove `created_by` and `updated_by` columns
- Track audit information in application layer

### 2. Update is_saas_admin() Function

```sql
CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Option 1: Check session variable
    RETURN current_setting('app.is_saas_admin', true)::boolean;

    -- Option 2: Check custom auth table
    -- RETURN EXISTS (
    --     SELECT 1 FROM auth_users
    --     WHERE id = current_setting('app.user_id', true)::uuid
    --     AND metadata->>'is_saas_admin' = 'true'
    -- );
END;
$$;
```

### 3. Update Application Code

**Set session variables** in your application:

```javascript
// Node.js example with node-postgres
const client = await pool.connect();
try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.organization_id = $1`, [orgId]);
    await client.query(`SET LOCAL app.environment_id = $1`, [envId]);
    await client.query(`SET LOCAL app.user_id = $1`, [userId]);

    // Your queries here with RLS applied
    const result = await client.query('SELECT * FROM orders');

    await client.query('COMMIT');
} finally {
    client.release();
}
```

### 4. Test RLS Policies

```sql
-- Test organization isolation
SET LOCAL app.organization_id = 'test-org-uuid';
SET LOCAL app.environment_id = 'test-env-uuid';

-- Should only return data for the set organization
SELECT * FROM organizations;
SELECT * FROM users;
SELECT * FROM orders;
```

### 5. Set Up Monitoring

```bash
# Enable Cloud SQL monitoring
gcloud sql instances patch YOUR_INSTANCE_NAME \
  --insights-config-query-insights-enabled \
  --insights-config-query-string-length=4096 \
  --insights-config-record-application-tags \
  --insights-config-record-client-address
```

### 6. Configure Backups

```bash
# Automated backups are enabled by default
# Verify backup configuration
gcloud sql instances describe YOUR_INSTANCE_NAME | grep backup

# Create on-demand backup
gcloud sql backups create --instance=YOUR_INSTANCE_NAME
```

## Performance Tuning

### Index Analysis

```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Query Performance

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Connection Pooling Tuning

For high-concurrency applications:
```ini
# PgBouncer configuration
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
```

## Troubleshooting

### Common Issues

**1. Extension Installation Fails**
```sql
-- Check available extensions
SELECT * FROM pg_available_extensions;

-- Install as superuser or use Cloud SQL Admin API
```

**2. RLS Policies Block Queries**
```sql
-- Temporarily disable RLS for testing (not recommended for production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check current session variables
SELECT current_setting('app.organization_id', true);
```

**3. Connection Limits Exceeded**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < now() - interval '10 minutes';
```

**4. Foreign Key Constraint Violations**
- Commented auth.users foreign keys should not cause issues
- If you need audit tracking, implement custom auth table first

## Security Considerations

### 1. Network Security
```bash
# Restrict IP access
gcloud sql instances patch YOUR_INSTANCE_NAME \
  --authorized-networks=YOUR_IP_ADDRESS/32
```

### 2. SSL/TLS Connections
```bash
# Require SSL
gcloud sql instances patch YOUR_INSTANCE_NAME \
  --require-ssl
```

### 3. IAM Authentication
```bash
# Enable IAM authentication
gcloud sql users create USERNAME \
  --instance=YOUR_INSTANCE_NAME \
  --type=CLOUD_IAM_USER
```

### 4. Secrets Management
```bash
# Store connection strings in Secret Manager
gcloud secrets create db-connection-string \
  --data-file=connection-string.txt
```

## Cost Optimization

### 1. Right-size Instance
- Start with smaller instances
- Monitor CPU and memory usage
- Scale up as needed

### 2. Storage Optimization
```sql
-- Regular VACUUM
VACUUM ANALYZE;

-- Check table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Connection Pooling
- Reduces instance size requirements
- Enables better resource utilization

### 4. Scheduled Instances
```bash
# For dev/test environments, stop instances after hours
gcloud sql instances patch YOUR_INSTANCE_NAME --activation-policy=NEVER
```

## Support and Resources

- **Cloud SQL Documentation**: https://cloud.google.com/sql/docs/postgres
- **PostgreSQL 15 Documentation**: https://www.postgresql.org/docs/15/
- **Cloud SQL Pricing**: https://cloud.google.com/sql/pricing
- **PgBouncer Documentation**: https://www.pgbouncer.org/

## Conclusion

The schema has been successfully adapted for Google Cloud SQL with:
- All 70 tables preserved
- All indexes, sequences, and triggers maintained
- Standard PostgreSQL extensions only
- RLS policies ready for custom authentication
- Comprehensive configuration recommendations

**Next Steps**:
1. Create Cloud SQL instance
2. Deploy the schema
3. Implement custom authentication
4. Update application code for session variables
5. Test thoroughly in staging environment
6. Monitor performance and optimize as needed
