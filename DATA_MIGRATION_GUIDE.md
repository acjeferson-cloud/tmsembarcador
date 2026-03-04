# Cloud SQL - Data Migration Guide

## Overview

This guide explains how to migrate your existing data from Supabase to Google Cloud SQL, including updating all records with the required `organization_id` and `environment_id` for multi-tenant support.

## Files

- **`cloudsql_data_migration_updates.sql`** - SQL script with all UPDATE statements
- **`full_schema_cloudsql.sql`** - Cloud SQL schema (apply this first)

## Migration Steps

### Step 1: Export Data from Supabase

```bash
# Export entire database
pg_dump -h db.xxxxxxxxxxxxx.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --column-inserts \
  --file=supabase_data_export.sql
```

Or use Supabase Dashboard:
1. Go to Database → Backups
2. Download the latest backup

### Step 2: Prepare Cloud SQL Instance

```bash
# Create Cloud SQL instance (if not already created)
gcloud sql instances create tms-production \
  --database-version=POSTGRES_15 \
  --tier=db-custom-4-16384 \
  --region=us-central1 \
  --backup-start-time=03:00 \
  --enable-point-in-time-recovery

# Create database
gcloud sql databases create tms --instance=tms-production
```

### Step 3: Apply Schema

```bash
# Get Cloud SQL IP
CLOUD_SQL_IP=$(gcloud sql instances describe tms-production \
  --format="value(ipAddresses[0].ipAddress)")

# Apply schema
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f full_schema_cloudsql.sql
```

### Step 4: Import Data

```bash
# Import data from Supabase export
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f supabase_data_export.sql
```

### Step 5: Run Update Scripts

**CRITICAL:** Before running, review and adjust organization/environment IDs!

```bash
# Apply updates to populate organization_id and environment_id
psql -h $CLOUD_SQL_IP -U postgres -d tms \
  -f cloudsql_data_migration_updates.sql
```

### Step 6: Verify Migration

```sql
-- Connect to Cloud SQL
psql -h $CLOUD_SQL_IP -U postgres -d tms

-- Check total tables
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Expected: 70 tables

-- Check tables with data
SELECT
  schemaname,
  relname as tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_live_tup > 0
ORDER BY n_live_tup DESC;
-- Expected: 47 tables with data

-- Verify organization_id is populated
SELECT
  'orders' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as with_org_id,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as without_org_id
FROM orders
UNION ALL
SELECT
  'invoices_nfe',
  COUNT(*),
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL),
  COUNT(*) FILTER (WHERE organization_id IS NULL)
FROM invoices_nfe
UNION ALL
SELECT
  'ctes_complete',
  COUNT(*),
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL),
  COUNT(*) FILTER (WHERE organization_id IS NULL)
FROM ctes_complete;
-- All should have 0 without_org_id
```

## Data Structure Overview

### Tables with Data (47 tables, ~1,859 records)

| Category | Tables | Records |
|----------|--------|---------|
| **Geography** | 5 | 656 |
| **Invoices (NF-e)** | 1 | 235 |
| **Transport (CT-e)** | 1 | 192 |
| **Orders** | 1 | 102 |
| **Freight Rates** | 3 | 113 |
| **NPS Surveys** | 2 | 93 |
| **Business Partners** | 3 | 74 |
| **Carriers** | 3 | 126 |
| **Users** | 1 | 15 |
| **Other Tables** | 27 | 253 |
| **TOTAL** | **47** | **~1,859** |

## Organization and Environment IDs

### Default Setup

The update script uses these default values:

```sql
-- Default Organization: "Demonstração"
organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e'

-- Default Environment: "Produção"
environment_id = 'abe69012-4449-4946-977e-46af45790a43'
```

### Available Organizations

Your database has 3 organizations:

1. **Demonstração** (00000001)
   - ID: `8b007dd0-0db6-4288-a1c1-7b05ffb7b32e`
   - Environments: Produção, Sandbox

2. **Segundo cliente** (00000003)
   - ID: `ac730ac4-2f10-4fb6-acc3-8325cb51ebc6`
   - Environments: Produção

3. **Quimidrol Comércio Indústria Importação LTDA** (00000002)
   - ID: `4ca4fdaa-5f55-48be-9195-3bc14413cb06`
   - Environments: Produção, Homologação

### Custom Organization Assignment

If you need to assign different organizations to specific data:

**Example: Assign invoices from a specific CNPJ to different organization**

```sql
-- Update invoices for specific company
UPDATE invoices_nfe
SET organization_id = '4ca4fdaa-5f55-48be-9195-3bc14413cb06',
    environment_id = '07f23b7e-471d-4968-a5fe-fd388e739780'
WHERE cnpj_emitente = '12345678000190'; -- Quimidrol CNPJ

-- Update related orders
UPDATE orders o
SET organization_id = '4ca4fdaa-5f55-48be-9195-3bc14413cb06',
    environment_id = '07f23b7e-471d-4968-a5fe-fd388e739780'
WHERE EXISTS (
  SELECT 1 FROM invoices_nfe nfe
  WHERE nfe.order_id = o.id
    AND nfe.organization_id = '4ca4fdaa-5f55-48be-9195-3bc14413cb06'
);
```

## Multi-Tenant Data Isolation

### How RLS Works After Migration

After running the updates, all records will have:
- `organization_id` - Associates data with a specific organization
- `environment_id` - Associates data with a specific environment (production, staging, etc.)

Row Level Security (RLS) policies will automatically filter data based on:

```sql
-- Application must set these session variables
SET LOCAL app.organization_id = 'uuid-here';
SET LOCAL app.environment_id = 'uuid-here';
```

### Testing Data Isolation

```sql
-- Test RLS for different organizations
-- Set context for Organization 1
SET LOCAL app.organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
SET LOCAL app.environment_id = 'abe69012-4449-4946-977e-46af45790a43';
SELECT COUNT(*) FROM orders; -- Should see only org 1 orders

-- Reset and set context for Organization 2
RESET app.organization_id;
RESET app.environment_id;
SET LOCAL app.organization_id = 'ac730ac4-2f10-4fb6-acc3-8325cb51ebc6';
SET LOCAL app.environment_id = '68d4e9f6-2a75-4b30-a660-721de45faedd';
SELECT COUNT(*) FROM orders; -- Should see only org 2 orders
```

## Troubleshooting

### Issue 1: NULL organization_id After Update

**Symptoms:**
```sql
SELECT COUNT(*) FROM orders WHERE organization_id IS NULL;
-- Returns > 0
```

**Solution:**
Check if the column exists:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('organization_id', 'environment_id');
```

If missing, add columns:
```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS organization_id uuid,
ADD COLUMN IF NOT EXISTS environment_id uuid;
```

Then re-run updates.

### Issue 2: Foreign Key Violations

**Symptoms:**
```
ERROR: insert or update on table "orders" violates foreign key constraint
```

**Solution:**
Ensure organizations and environments exist first:
```sql
-- Check if organizations exist
SELECT id, name FROM organizations;

-- If missing, create them
INSERT INTO organizations (id, name, slug, is_active)
VALUES
  ('8b007dd0-0db6-4288-a1c1-7b05ffb7b32e', 'Demonstração', '00000001', true),
  ('ac730ac4-2f10-4fb6-acc3-8325cb51ebc6', 'Segundo cliente', '00000003', true),
  ('4ca4fdaa-5f55-48be-9195-3bc14413cb06', 'Quimidrol', '00000002', true);
```

### Issue 3: RLS Blocking All Queries

**Symptoms:**
```sql
SELECT * FROM orders;
-- Returns 0 rows (but should have data)
```

**Solution:**
Set session variables:
```sql
SET LOCAL app.organization_id = '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e';
SET LOCAL app.environment_id = 'abe69012-4449-4946-977e-46af45790a43';
SELECT * FROM orders; -- Should now return data
```

Or temporarily disable RLS for testing:
```sql
-- ONLY FOR TESTING! Never in production!
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
SELECT * FROM orders;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

### Issue 4: Performance Issues After Migration

**Symptoms:**
Slow queries after migration

**Solution:**
Rebuild statistics and indexes:
```sql
-- Analyze all tables
ANALYZE;

-- Reindex if needed
REINDEX DATABASE tms;

-- Check missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.5;
```

## Application Code Updates

### Node.js with pg Library

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.CLOUD_SQL_IP,
  port: 5432,
  database: 'tms',
  user: 'app_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
});

async function queryWithContext(organizationId, environmentId, sql, params) {
  const client = await pool.connect();
  try {
    // Set session context for RLS
    await client.query(
      `SET LOCAL app.organization_id = $1; SET LOCAL app.environment_id = $2;`,
      [organizationId, environmentId]
    );

    // Execute query
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Usage
const orders = await queryWithContext(
  '8b007dd0-0db6-4288-a1c1-7b05ffb7b32e',
  'abe69012-4449-4946-977e-46af45790a43',
  'SELECT * FROM orders WHERE status = $1',
  ['pending']
);
```

### Express.js Middleware

```javascript
// Middleware to set session context
async function setTenantContext(req, res, next) {
  const { organizationId, environmentId } = req.user; // From JWT/session

  req.dbClient = await pool.connect();

  try {
    await req.dbClient.query(
      'SET LOCAL app.organization_id = $1; SET LOCAL app.environment_id = $2;',
      [organizationId, environmentId]
    );
    next();
  } catch (error) {
    req.dbClient.release();
    next(error);
  }
}

// Cleanup middleware
async function releaseDbClient(req, res, next) {
  if (req.dbClient) {
    req.dbClient.release();
  }
  next();
}

// Usage
app.use(setTenantContext);
app.get('/api/orders', async (req, res) => {
  const result = await req.dbClient.query('SELECT * FROM orders');
  res.json(result.rows);
});
app.use(releaseDbClient);
```

## Rollback Plan

If migration fails, you can rollback:

### Option 1: Restore from Backup

```bash
# Restore from Cloud SQL backup
gcloud sql backups restore BACKUP_ID \
  --instance=tms-production
```

### Option 2: Drop and Recreate

```bash
# Drop database
gcloud sql databases delete tms --instance=tms-production

# Recreate
gcloud sql databases create tms --instance=tms-production

# Reapply schema and data
psql -h $CLOUD_SQL_IP -U postgres -d tms -f full_schema_cloudsql.sql
psql -h $CLOUD_SQL_IP -U postgres -d tms -f supabase_data_export.sql
```

## Migration Checklist

### Pre-Migration
- [ ] Backup Supabase database
- [ ] Export all data from Supabase
- [ ] Create Cloud SQL instance
- [ ] Test schema application on staging
- [ ] Review organization/environment IDs
- [ ] Notify users of maintenance window

### Migration
- [ ] Apply schema to Cloud SQL
- [ ] Import data
- [ ] Run update scripts
- [ ] Verify all tables have data
- [ ] Test RLS policies
- [ ] Check application connectivity

### Post-Migration
- [ ] Verify data integrity
- [ ] Test key application features
- [ ] Monitor performance
- [ ] Update DNS/connection strings
- [ ] Document any issues
- [ ] Keep Supabase backup for 30 days

## Performance Optimization

### After Migration

```sql
-- Update statistics
ANALYZE;

-- Create additional indexes if needed
CREATE INDEX CONCURRENTLY idx_orders_org_env
ON orders(organization_id, environment_id)
WHERE organization_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_invoices_org_env
ON invoices_nfe(organization_id, environment_id)
WHERE organization_id IS NOT NULL;

-- Set autovacuum settings
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

## Cost Estimation

### Migration Downtime
- Schema application: 2-5 minutes
- Data import: 10-30 minutes (depends on data size)
- Update scripts: 5-10 minutes
- Verification: 5-10 minutes
- **Total: 30-60 minutes**

### Storage Requirements
- Current Supabase data: ~200 MB
- Cloud SQL requirements: ~300 MB (with indexes)
- Backup storage: ~200 MB

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review `CLOUD_SQL_MIGRATION_GUIDE.md`
3. Check Cloud SQL logs: `gcloud sql operations list --instance=tms-production`
4. Review PostgreSQL logs in Cloud Console

---

**Generated:** 2026-02-17
**Version:** 1.0
**Status:** ✅ Ready for Production Migration
