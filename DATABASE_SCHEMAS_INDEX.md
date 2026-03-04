# Database Schemas - Complete Index

## Overview

This project includes **two production-ready PostgreSQL schemas**:
1. **Supabase Version** - For Supabase PostgreSQL
2. **Cloud SQL Version** - For Google Cloud SQL PostgreSQL

Both schemas are complete, tested, and ready for deployment.

---

## Quick Navigation

### Need to Deploy Quickly?
- **Supabase:** Read `FULL_SCHEMA_README.md` → Apply `full_schema.sql`
- **Cloud SQL:** Read `CLOUD_SQL_QUICK_START.md` → Apply `full_schema_cloudsql.sql`

### Need to Compare Options?
- Read `SCHEMAS_COMPARISON.md` for detailed comparison

### Need Migration Guide?
- **To Cloud SQL:** Read `CLOUD_SQL_MIGRATION_GUIDE.md`

---

## Files Organization

### 📄 Schema Files (SQL)

| File | Size | Target | Status |
|------|------|--------|--------|
| `full_schema.sql` | 91 KB | Supabase PostgreSQL | ✅ Ready |
| `full_schema_cloudsql.sql` | 94 KB | Cloud SQL PostgreSQL 15+ | ✅ Ready |
| `full_schema_header.sql` | 4.8 KB | Legacy (ignore) | ⚠️ Old |

---

## 📚 Documentation Files

### Supabase Documentation

| File | Size | Purpose |
|------|------|---------|
| `FULL_SCHEMA_README.md` | 11 KB | Complete user guide for Supabase schema |
| `SCHEMA_SUMMARY.md` | 7.8 KB | Technical reference with table details |
| `SCHEMA_VALIDATION.md` | 6.9 KB | Quality assurance and validation report |
| `SCHEMA_FILES_INDEX.md` | 7.2 KB | Navigation guide for schema files |

### Cloud SQL Documentation

| File | Size | Purpose |
|------|------|---------|
| `CLOUD_SQL_QUICK_START.md` | 8.1 KB | Quick deployment guide for Cloud SQL |
| `CLOUD_SQL_MIGRATION_GUIDE.md` | 14 KB | Complete migration guide with examples |
| `VERIFICATION_CHECKLIST.md` | 5.9 KB | Pre/post deployment validation |
| `DEPLOY_GOOGLE_CLOUD.md` | 5.6 KB | GCP deployment instructions |

### Comparison Documentation

| File | Size | Purpose |
|------|------|---------|
| `SCHEMAS_COMPARISON.md` | 11 KB | Side-by-side comparison of both schemas |
| `SUPABASE_VS_CLOUD_SQL_TECHNICAL.md` | 32 KB | Deep technical comparison |

---

## 📊 Schema Statistics

Both schemas contain the same structure:

| Component | Count |
|-----------|-------|
| **Tables** | 70 |
| **Sequences** | 3 |
| **Indexes** | 73 |
| **Triggers** | 19 |
| **Functions** | 5 |
| **RLS Policies** | 30 |

---

## 🎯 Choose Your Schema

### Use Supabase Schema (`full_schema.sql`) if:

✅ You want built-in authentication
✅ You need real-time subscriptions
✅ You want automatic API generation
✅ You prefer managed service
✅ You're building a rapid prototype
✅ Your team is small (< 5 developers)

**Files to Read:**
1. `FULL_SCHEMA_README.md` - Start here
2. `SCHEMA_SUMMARY.md` - Reference
3. `full_schema.sql` - Apply this

### Use Cloud SQL Schema (`full_schema_cloudsql.sql`) if:

✅ You need full PostgreSQL control
✅ You have existing GCP infrastructure
✅ You need dedicated resources
✅ You want VPC peering
✅ You have compliance requirements
✅ Your team has PostgreSQL expertise

**Files to Read:**
1. `CLOUD_SQL_QUICK_START.md` - Start here
2. `CLOUD_SQL_MIGRATION_GUIDE.md` - Details
3. `full_schema_cloudsql.sql` - Apply this

---

## 📖 Reading Order by Use Case

### Case 1: New to the Project
```
1. DATABASE_SCHEMAS_INDEX.md (this file)
2. SCHEMAS_COMPARISON.md
3. Choose your platform:
   - Supabase: FULL_SCHEMA_README.md
   - Cloud SQL: CLOUD_SQL_QUICK_START.md
```

### Case 2: Ready to Deploy on Supabase
```
1. FULL_SCHEMA_README.md
2. SCHEMA_SUMMARY.md (reference)
3. Apply: full_schema.sql
4. Verify: SCHEMA_VALIDATION.md
```

### Case 3: Ready to Deploy on Cloud SQL
```
1. CLOUD_SQL_QUICK_START.md
2. CLOUD_SQL_MIGRATION_GUIDE.md
3. Apply: full_schema_cloudsql.sql
4. Verify: VERIFICATION_CHECKLIST.md
```

### Case 4: Migrating from Supabase to Cloud SQL
```
1. SCHEMAS_COMPARISON.md
2. CLOUD_SQL_MIGRATION_GUIDE.md
3. VERIFICATION_CHECKLIST.md
4. Apply: full_schema_cloudsql.sql
```

### Case 5: Technical Deep Dive
```
1. SCHEMA_SUMMARY.md
2. SUPABASE_VS_CLOUD_SQL_TECHNICAL.md
3. Review both SQL files
4. SCHEMA_VALIDATION.md
```

---

## 🗂️ Table Categories (70 Tables)

Both schemas include these table groups:

### 1. SaaS & Multi-Tenant (6 tables)
- Organizations, environments, plans
- SaaS admin users and settings

### 2. Geography & Location (5 tables)
- Countries, states, cities
- ZIP codes, holidays

### 3. User Management (4 tables)
- Users, licenses, establishments
- License audit logs

### 4. Business Partners (3 tables)
- Partners, addresses, contacts

### 5. Carrier Management (3 tables)
- Carriers, occurrences, rejection reasons

### 6. Freight Rates (6 tables)
- Rate tables, rates, details
- City rates, fees, restrictions

### 7. Order Management (6 tables)
- Orders, items, delivery status
- Pickups, quotes, quote history

### 8. Invoice & Billing (4 tables)
- Invoices, bills, bill-invoices
- Brazilian NF-e master

### 9. Brazilian NF-e (5 tables)
- Electronic invoices with carriers
- Customers, products, occurrences

### 10. Brazilian CT-e (3 tables)
- Electronic transport documents
- Invoice relationships, carrier costs

### 11. Reverse Logistics (2 tables)
- Return orders and items

### 12. NPS System (4 tables)
- Configuration, surveys
- Internal ratings, email history

### 13. API Keys (2 tables)
- Key configuration and rotation history

### 14. Configuration (5 tables)
- Email, Google Maps, OpenAI
- WhatsApp config and templates

### 15. Communication (2 tables)
- WhatsApp messages and transactions

### 16. Audit & Logging (2 tables)
- Change logs, XML import logs

### 17. Innovation & Feedback (3 tables)
- Innovations, user votes, suggestions

### 18. Deployment Tracking (6 tables)
- Projects, uploads, interpretations
- Validations, executions, suggestions

---

## 🔑 Key Differences Between Schemas

| Feature | Supabase | Cloud SQL |
|---------|----------|-----------|
| **Extensions** | 5 (includes pg_graphql, supabase_vault) | 3 (standard PostgreSQL only) |
| **Authentication** | Built-in (auth.users) | Custom required |
| **Foreign Keys** | 7 tables reference auth.users | All commented out |
| **RLS with Auth** | Uses auth.uid() | Uses session variables |
| **Schema Declaration** | WITH SCHEMA extensions | Default public schema |
| **Ready to Deploy** | Yes (no changes needed) | Yes (auth implementation needed) |

---

## ⚙️ Implementation Requirements

### Supabase Schema
- ✅ Zero configuration needed
- ✅ Apply SQL file directly
- ✅ Use Supabase client library
- ✅ Authentication built-in

### Cloud SQL Schema
- ⚠️ Implement authentication system
- ⚠️ Update `is_saas_admin()` function
- ⚠️ Set session variables in app
- ⚠️ Configure connection pooling
- ✅ Otherwise ready to deploy

---

## 🚀 Quick Start Commands

### Supabase
```bash
# 1. Create project at supabase.com
# 2. Open SQL Editor
# 3. Copy and paste full_schema.sql
# 4. Run the script
# Done!
```

### Cloud SQL
```bash
# 1. Create instance
gcloud sql instances create tms-prod \
  --database-version=POSTGRES_15 \
  --tier=db-custom-4-16384 \
  --region=us-central1

# 2. Create database
gcloud sql databases create tms --instance=tms-prod

# 3. Apply schema
psql -h CLOUD_SQL_IP -U postgres -d tms -f full_schema_cloudsql.sql

# 4. Verify
psql -h CLOUD_SQL_IP -U postgres -d tms -c "\dt"
```

---

## 🔍 Verification Steps

### After Applying Schema

```sql
-- Check table count (should be 70)
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- Check extensions
SELECT * FROM pg_extension;

-- Check RLS enabled tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check indexes (should be 73)
SELECT count(*) FROM pg_indexes
WHERE schemaname = 'public';

-- Check sequences (should be 3)
SELECT count(*) FROM pg_sequences
WHERE schemaname = 'public';
```

---

## 📞 Support & Resources

### Documentation
- All questions answered in the documentation files above
- Each file has specific purpose and target audience

### External Resources
- **Supabase:** https://supabase.com/docs
- **Cloud SQL:** https://cloud.google.com/sql/docs
- **PostgreSQL 15:** https://www.postgresql.org/docs/15/

### File Issues
- Missing tables? Check the SQL file directly
- Deployment errors? Read the migration guide
- Performance issues? Check optimization sections

---

## 📋 Checklist for Production

### Pre-Deployment
- [ ] Read appropriate documentation
- [ ] Choose platform (Supabase or Cloud SQL)
- [ ] Review schema file
- [ ] Backup existing data (if migrating)
- [ ] Test in staging environment

### Deployment
- [ ] Create database instance
- [ ] Apply schema SQL file
- [ ] Verify table count (70 tables)
- [ ] Check extensions installed
- [ ] Test RLS policies
- [ ] Import data (if migrating)

### Post-Deployment
- [ ] Run verification queries
- [ ] Test application connectivity
- [ ] Verify data isolation (multi-tenant)
- [ ] Check performance
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Document connection strings

### Cloud SQL Only
- [ ] Implement authentication system
- [ ] Update is_saas_admin() function
- [ ] Set session variables in app code
- [ ] Configure connection pooling (PgBouncer)
- [ ] Set recommended database flags

---

## 📈 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-17 | Initial release with both schemas |

---

## 📝 File Manifest

```
Database Schema Files:
├── full_schema.sql (91 KB)                          # Supabase PostgreSQL
├── full_schema_cloudsql.sql (94 KB)                 # Cloud SQL PostgreSQL
│
Supabase Documentation:
├── FULL_SCHEMA_README.md (11 KB)                    # User guide
├── SCHEMA_SUMMARY.md (7.8 KB)                       # Technical reference
├── SCHEMA_VALIDATION.md (6.9 KB)                    # Validation report
├── SCHEMA_FILES_INDEX.md (7.2 KB)                   # Navigation guide
│
Cloud SQL Documentation:
├── CLOUD_SQL_QUICK_START.md (8.1 KB)               # Quick start
├── CLOUD_SQL_MIGRATION_GUIDE.md (14 KB)            # Migration guide
├── VERIFICATION_CHECKLIST.md (5.9 KB)              # Validation steps
├── DEPLOY_GOOGLE_CLOUD.md (5.6 KB)                 # GCP deployment
│
Comparison Documentation:
├── SCHEMAS_COMPARISON.md (11 KB)                    # Side-by-side comparison
├── SUPABASE_VS_CLOUD_SQL_TECHNICAL.md (32 KB)      # Technical deep dive
│
Navigation:
└── DATABASE_SCHEMAS_INDEX.md (this file)            # You are here

Total: 12 files, ~193 KB documentation + 2 SQL files
```

---

## ✅ Status Summary

| Schema | Status | Tables | Ready? |
|--------|--------|--------|--------|
| **Supabase** | ✅ Production Ready | 70 | Yes - Deploy now |
| **Cloud SQL** | ✅ Production Ready | 70 | Yes - Auth needed |

---

**Choose your platform, read the appropriate guide, and deploy!**

**Generated:** 2026-02-17
**Version:** 1.0
**Maintained by:** TMS Development Team
