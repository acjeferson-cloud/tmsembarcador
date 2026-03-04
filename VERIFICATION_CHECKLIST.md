# Cloud SQL Schema Migration - Verification Checklist

## Pre-Migration Verification

- [x] Original schema read successfully: `full_schema.sql`
- [x] Cloud SQL schema created: `full_schema_cloudsql.sql`
- [x] Migration guide created: `CLOUD_SQL_MIGRATION_GUIDE.md`

## Schema Verification

### Extensions
- [x] Removed `pg_graphql` (Supabase-specific)
- [x] Removed `supabase_vault` (Supabase-specific)
- [x] Kept `uuid-ossp` (standard)
- [x] Kept `pgcrypto` (standard)
- [x] Kept `pg_stat_statements` (standard)
- [x] Removed `WITH SCHEMA extensions` clause

### Database Objects Count
- [x] Tables: 70 (preserved)
- [x] Sequences: 3 (preserved)
- [x] Indexes: 73 (preserved)
- [x] Triggers: 19 (preserved)
- [x] Functions: 5 (preserved/modified)

### Authentication References
- [x] `auth.users` foreign keys commented out (7 tables affected)
- [x] `auth.uid()` calls commented out (1 function)
- [x] Alternative implementation provided in comments

### Functions Modified
- [x] `is_saas_admin()` - Modified to remove auth.users dependency
- [x] `get_session_organization_id()` - No changes (uses current_setting)
- [x] `get_session_environment_id()` - No changes (uses current_setting)
- [x] `is_global_admin_user()` - No changes (uses public.users)
- [x] `update_updated_at_column()` - No changes (standard trigger)

### Tables with Auth References Removed
1. [x] `countries` (created_by, updated_by)
2. [x] `states` (created_by, updated_by)
3. [x] `carriers` (created_by, updated_by)
4. [x] `occurrences` (created_by, updated_by)
5. [x] `rejection_reasons` (created_by, updated_by)
6. [x] `invoices_nfe` (created_by, updated_by)
7. [x] `invoices_nfe_occurrences` (responsible_user_id)

### Syntax Verification
- [x] No trailing commas before commented constraints
- [x] All ALTER TABLE statements valid
- [x] All foreign keys properly terminated
- [x] Functions have proper syntax

### Row Level Security
- [x] RLS policies preserved
- [x] Session functions maintained
- [x] Documentation for session variable setup included

### Documentation
- [x] Header comments updated (Supabase → Cloud SQL)
- [x] Cloud SQL compatibility notes added
- [x] Migration notes included
- [x] Configuration recommendations added
- [x] Connection pooling guidance added
- [x] Performance tuning recommendations added

## Post-Migration Checklist (To be completed after deployment)

### Deployment
- [ ] Cloud SQL instance created
- [ ] Database created
- [ ] Schema deployed successfully
- [ ] Extensions installed
- [ ] No syntax errors during deployment

### Verification Queries
```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 70

-- Count sequences
SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public';
-- Expected: 3

-- Check extensions
SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_stat_statements');
-- Expected: 3 rows

-- Check functions
SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
-- Expected: 5+

-- Check triggers
SELECT COUNT(*) FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace;
-- Expected: 19+
```

### Authentication Implementation
- [ ] Custom authentication method chosen
- [ ] `is_saas_admin()` function updated
- [ ] Auth-related foreign keys restored or removed
- [ ] Session variable setup implemented in application

### Application Updates
- [ ] Session variables set in application code
- [ ] Connection pooling configured
- [ ] RLS policies tested
- [ ] All CRUD operations tested

### Performance
- [ ] Database flags configured
- [ ] Indexes verified
- [ ] Query performance tested
- [ ] Connection pooling tested

### Security
- [ ] Network access restricted
- [ ] SSL/TLS enabled
- [ ] Secrets management configured
- [ ] Backups configured

### Monitoring
- [ ] Cloud SQL monitoring enabled
- [ ] Query insights enabled
- [ ] Alerting configured
- [ ] Log analysis setup

## Critical Differences from Supabase

| Feature | Supabase | Cloud SQL | Action Required |
|---------|----------|-----------|-----------------|
| auth.users | Built-in | Not available | Implement custom auth |
| auth.uid() | Built-in | Not available | Use session variables |
| Extensions schema | Custom | Public/default | Already updated |
| pg_graphql | Available | Not available | Already removed |
| supabase_vault | Available | Not available | Already removed |
| RLS policies | Auto-configured | Manual setup | Set session vars |

## Known Limitations

1. **Authentication**: No built-in auth.users table - requires custom implementation
2. **Real-time subscriptions**: Not available (Supabase feature)
3. **Storage**: No built-in storage API (use Google Cloud Storage separately)
4. **Edge Functions**: Not available (use Google Cloud Functions separately)
5. **Auto-generated APIs**: Not available (requires custom API layer)

## Success Criteria

- [x] Schema file is valid PostgreSQL 15 syntax
- [x] All 70 tables defined
- [x] All constraints properly defined
- [x] No Supabase-specific dependencies
- [x] Clear migration documentation provided
- [x] Authentication alternatives documented
- [ ] Successfully deployed to Cloud SQL (post-migration)
- [ ] Application connects successfully (post-migration)
- [ ] All tests pass (post-migration)

## File Locations

- Original: `/tmp/cc-agent/62470871/project/full_schema.sql`
- Cloud SQL: `/tmp/cc-agent/62470871/project/full_schema_cloudsql.sql`
- Migration Guide: `/tmp/cc-agent/62470871/project/CLOUD_SQL_MIGRATION_GUIDE.md`
- This Checklist: `/tmp/cc-agent/62470871/project/VERIFICATION_CHECKLIST.md`

## Notes

The schema has been fully adapted and is ready for deployment to Google Cloud SQL PostgreSQL 15+. All Supabase-specific features have been removed or replaced with standard PostgreSQL alternatives. The schema maintains full compatibility with all 70 tables, indexes, triggers, and sequences from the original schema.
