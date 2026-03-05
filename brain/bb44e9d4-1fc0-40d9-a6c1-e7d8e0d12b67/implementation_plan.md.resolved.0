# Directory Structure Refactoring Plan

## Current State Analysis

### 📊 Root Directory Overview
The project root contains **27 files** and **9 directories** - this is cluttered and confusing.

### 🔴 Critical Issues Identified

#### 1. Documentation Scattered at Root (8 files)
```
BACKUP_SETUP_GUIDE.md
DOCUMENTATION.md
FINAL_COMPLETION_REPORT.md
LOCAL_SETUP.md
PRIORITY1_COMPLETION_REPORT.md
PROJECT_NOTES.md
SECURITY_STEP1_VERIFICATION.md
STEP2_COMPLETION_SUMMARY.md
```
**Problem:** Makes root messy, hard to find active code

#### 2. Duplicate/Archive Zip Files (6 files, ~530MB)
```
final_deploy_v2.zip         (~100MB)
final_deploy_v3.zip         (~100MB)
final_deploy_v4.zip         (~100MB)
final_deploy_v5.zip         (~100MB)
final_deploy_v6_with_db.zip (~100MB)
full_website_with_frontend.zip (~100MB)
college_website_backend.zip (~11KB)
```
**Problem:** Wastes disk space, clutters root, confusing versioning

#### 3. Scripts Mixed at Root Level (6 files)
```
deploy_prepare.sh
prepare_deployment.sh
import_database.sh
setup_database.sh
test_all_features.sh
test_gallery_upload.sh
test_local_api.sh
update_api_urls.sh
```
**Problem:** Should be in `/scripts` directory

#### 4. Database Files at Root (2 files)
```
create_admin_user.sql
ldm_production_20260201.sql.gz
```
**Problem:** Should be in `/database` directory

#### 5. Unclear Folder Naming
| Current Name | Issue |
|--------------|-------|
| `ldm_test` | Not clear this is the MAIN frontend |
| `testbackend` | Contains Gibbon core, not "test" code |
| `frontend_integration` | Only 3 files, appears abandoned |
| `deploy_package` | Duplicate of deployable code |
| `final_deploy_v2` | Another duplicate |

#### 6. Duplicate Code Directories
- `deploy_package/` (411 files) - duplicate
- `final_deploy_v2/` (157 files) - duplicate
- Both can be regenerated from source

---

## Proposed Directory Structure

```
ldm-college-erp/                    # Root (clean name)
│
├── frontend/                       # React Frontend (renamed from ldm_test)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── api/                            # Backend API (keep as-is)
│   ├── index.php
│   ├── vendor/
│   └── ...
│
├── gibbon/                         # Gibbon ERP Core (renamed from testbackend)
│   └── core-31.0.00/
│
├── database/                       # All SQL files
│   ├── schema/
│   │   ├── create_tables.sql
│   │   └── audit_and_permissions.sql
│   ├── migrations/
│   │   └── create_admin_user.sql
│   └── backups/
│       └── ldm_production_20260201.sql.gz
│
├── scripts/                        # All scripts
│   ├── deploy/
│   │   ├── deploy_prepare.sh
│   │   └── prepare_deployment.sh
│   ├── database/
│   │   ├── import_database.sh
│   │   └── setup_database.sh
│   ├── testing/
│   │   ├── test_all_features.sh
│   │   ├── test_cache.sh
│   │   └── ...
│   └── backup/
│       ├── backup.sh
│       └── restore.sh
│
├── docs/                           # All documentation
│   ├── setup/
│   │   ├── LOCAL_SETUP.md
│   │   └── BACKUP_SETUP_GUIDE.md
│   ├── api/
│   │   └── DOCUMENTATION.md
│   ├── security/
│   │   └── SECURITY_STEP1_VERIFICATION.md
│   └── reports/
│       ├── FINAL_COMPLETION_REPORT.md
│       ├── PRIORITY1_COMPLETION_REPORT.md
│       └── PROJECT_NOTES.md
│
├── archives/                       # Old deployments (can be deleted later)
│   ├── final_deploy_v2.zip
│   └── ...
│
├── .user.ini                       # PHP config (keep at root)
├── router.php                      # PHP router (keep at root)
└── README.md                       # Project README (create new)
```

---

## Files That MUST NOT Be Moved

> [!CAUTION]
> These files are referenced in code/configs and must stay in place:

| File | Reason |
|------|--------|
| `api/index.php` | Main API entry point |
| `api/vendor/*` | Composer dependencies |
| `api/.htaccess` | Apache config for production |
| `api/*.php` | All PHP classes (referenced by index.php) |
| `ldm_test/src/*` | All React components (import paths) |
| `ldm_test/vite.config.ts` | Vite configuration |
| `ldm_test/package.json` | NPM dependencies |
| `ldm_test/public/*` | Static assets |
| `.user.ini` | PHP OPcache config (must be at root) |
| `router.php` | PHP built-in server routing |

---

## Safe Migration Plan

### Phase 1: Create New Directories (Safe)
```bash
mkdir -p docs/{setup,api,security,reports}
mkdir -p database/{schema,migrations,backups}
mkdir -p scripts/{deploy,database,testing,backup}
mkdir -p archives
```

### Phase 2: Move Documentation (Safe)
```bash
# Setup docs
mv LOCAL_SETUP.md docs/setup/
mv BACKUP_SETUP_GUIDE.md docs/setup/

# API docs
mv DOCUMENTATION.md docs/api/

# Security docs
mv SECURITY_STEP1_VERIFICATION.md docs/security/

# Reports
mv FINAL_COMPLETION_REPORT.md docs/reports/
mv PRIORITY1_COMPLETION_REPORT.md docs/reports/
mv STEP2_COMPLETION_SUMMARY.md docs/reports/
mv PROJECT_NOTES.md docs/reports/
```

### Phase 3: Organize Database Files (Safe)
```bash
# Move SQL schema files
mv database/create_tables.sql database/schema/
mv database/audit_and_permissions.sql database/schema/

# Move migrations
mv create_admin_user.sql database/migrations/

# Move backups
mv ldm_production_20260201.sql.gz database/backups/
```

### Phase 4: Organize Scripts (Safe)
```bash
# Deploy scripts
mv deploy_prepare.sh scripts/deploy/
mv prepare_deployment.sh scripts/deploy/

# Database scripts
mv import_database.sh scripts/database/
mv setup_database.sh scripts/database/

# Testing scripts
mv test_all_features.sh scripts/testing/
mv test_gallery_upload.sh scripts/testing/
mv test_local_api.sh scripts/testing/
mv update_api_urls.sh scripts/testing/

# Move existing scripts to subcategories
mv scripts/backup.sh scripts/backup/
mv scripts/restore.sh scripts/backup/
mv scripts/benchmark_api.sh scripts/testing/
mv scripts/test_backup_system.sh scripts/testing/
mv scripts/test_cache.sh scripts/testing/
mv scripts/test_frontend_integration.sh scripts/testing/
mv scripts/test_health_check.sh scripts/testing/
mv scripts/optimize_database.sql database/migrations/
```

### Phase 5: Archive Duplicates (Safe)
```bash
# Move old deployment packages to archives
mv final_deploy_v2.zip archives/
mv final_deploy_v3.zip archives/
mv final_deploy_v4.zip archives/
mv final_deploy_v5.zip archives/
mv final_deploy_v6_with_db.zip archives/
mv full_website_with_frontend.zip archives/
mv college_website_backend.zip archives/

# Move duplicate directories
mv deploy_package archives/
mv final_deploy_v2 archives/
```

### Phase 6: Rename Main Directories (⚠️ Requires Config Updates)

> [!WARNING]
> These renames require updating configuration files

#### Rename `ldm_test` → `frontend`
**Files to update:**
- Any scripts referencing `ldm_test`
- `LOCAL_SETUP.md` documentation
- `import_database.sh` (if it references frontend path)

```bash
mv ldm_test frontend
```

#### Rename `testbackend` → `gibbon`
```bash
mv testbackend gibbon
```

#### Remove `frontend_integration` (unused)
```bash
# Check if files are needed first
rm -rf frontend_integration  # Only if confirmed unused
```

### Phase 7: Create Project README
Create a new `README.md` at root explaining the project structure.

---

## Verification Plan

### Automated Verification
```bash
# 1. Verify API still works
curl http://localhost:8000/health

# 2. Verify frontend still builds
cd frontend && npm run build

# 3. Run existing test scripts from new locations
./scripts/testing/test_all_features.sh
```

### Manual Verification
1. Start backend: `cd api && php -S localhost:8000`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173 - verify homepage loads
4. Try logging in - verify authentication works

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| Move .md files | ✅ Very Low | No code references |
| Move .sql files | ✅ Very Low | Only manual usage |
| Move .sh scripts | ⚠️ Low | Update any hardcoded paths |
| Move .zip archives | ✅ Very Low | Not used in runtime |
| Rename `ldm_test` | 🔴 Medium | Update paths in docs/scripts |
| Rename `testbackend` | ✅ Very Low | Not referenced anywhere |

---

## Recommended Execution Order

1. ✅ **Phase 1-2:** Create dirs and move docs (5 mins, zero risk)
2. ✅ **Phase 3:** Organize database files (2 mins, zero risk)
3. ✅ **Phase 4:** Organize scripts (5 mins, low risk)
4. ✅ **Phase 5:** Archive duplicates (1 min, zero risk)
5. ⚠️ **Phase 6:** Rename directories (10 mins, requires testing)
6. ✅ **Phase 7:** Create README (5 mins, zero risk)

**Total time:** ~30 minutes

---

## User Review Required

> [!IMPORTANT]
> Before proceeding, please confirm:

1. **Can I delete** the `frontend_integration/` directory? (3 unused files)
2. **Can I archive** the 6 zip files (~530MB)? Or should I delete them?
3. **Do you want me to rename** `ldm_test` → `frontend`?
4. **Should I update** script references after moves?
