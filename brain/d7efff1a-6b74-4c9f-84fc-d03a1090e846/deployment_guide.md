# LDM College Gibbon Backend - Deployment Guide

## Overview
This guide walks you through deploying the Gibbon Education Platform backend to Hostinger shared hosting.

## Prerequisites

- [ ] Hostinger hosting account with:
  - PHP 8.0+ support
  - MySQL 8.0 database
  - SSH access (optional but recommended)
  - File manager or FTP access
- [ ] Database credentials from Hostinger
- [ ] Domain configured: `ldmcollege.com`
- [ ] SSL certificate installed (Let's Encrypt via Hostinger)

---

## Part 1: Local Preparation

### Step 1: Install Composer Dependencies

```bash
cd "/media/swastik/focus/ldm new updae 2.0/testbackend/core-31.0.00"
composer install --no-dev --optimize-autoloader
```

### Step 2: Generate Security Keys

```bash
# Generate session key (32 characters)
openssl rand -base64 32

# Generate JWT secret (32 characters)
openssl rand -base64 32
```

**Save these keys** - you'll need them for the `.env` file.

### Step 3: Create Deployment Package

```bash
cd "/media/swastik/focus/ldm new updae 2.0"
./deploy_prepare.sh
```

This creates a zip file: `gibbon_deployment_YYYYMMDD_HHMMSS.zip`

---

## Part 2: Hostinger Setup

### Step 1: Access Hostinger hPanel

1. Login to: https://hpanel.hostinger.com
2. Select your hosting account
3. Navigate to **File Manager**

### Step 2: Create Directory Structure

Navigate to `/home/u542293952/` and create:

```
├── public_html/
│   ├── backend/          (Gibbon core)
│   └── api/              (REST API)
└── private/              (Outside web root)
    ├── logs/
    └── backups/
```

### Step 3: Upload Files

**Option A: File Manager**
1. Upload `gibbon_deployment_*.zip` to `/home/u542293952/`
2. Right-click → Extract
3. Move folders to correct locations:
   - `gibbon_deployment/backend/*` → `/public_html/backend/`
   - `gibbon_deployment/api/*` → `/public_html/api/`
   - `gibbon_deployment/private/*` → `/private/`

**Option B: FTP (Recommended for large files)**
```bash
# Use FileZilla or similar FTP client
Host: ftp.ldmcollege.com
Username: u542293952
Password: [your FTP password]
Port: 21
```

### Step 4: Set File Permissions

Via File Manager or SSH:

```bash
# Directories
chmod 755 /home/u542293952/public_html/backend
chmod 755 /home/u542293952/public_html/backend/uploads
chmod 755 /home/u542293952/public_html/backend/resources
chmod 755 /home/u542293952/public_html/api

# Configuration files
chmod 600 /home/u542293952/private/.env

# Make uploads writable
chmod 775 /home/u542293952/public_html/backend/uploads
```

---

## Part 3: Database Setup

### Step 1: Access phpMyAdmin

1. In hPanel, go to **Databases** → **phpMyAdmin**
2. Select database: `u542293952_productionldm`

### Step 2: Import Gibbon Schema

1. Click **Import** tab
2. Click **Choose File**
3. Select `gibbon.sql` from:
   `/media/swastik/focus/ldm new updae 2.0/testbackend/core-31.0.00/gibbon.sql`
4. Click **Go** (wait for import - may take 2-3 minutes)

### Step 3: Verify Import

Run this query to check:
```sql
SHOW TABLES;
```

You should see 100+ tables starting with `gibbon`.

### Step 4: Update Admin Password

```sql
UPDATE gibbonPerson 
SET password = '$2y$10$YourNewBcryptHashHere'
WHERE username = 'admin';
```

To generate bcrypt hash:
```bash
php -r "echo password_hash('YourNewPassword', PASSWORD_BCRYPT);"
```

---

## Part 4: Configuration

### Step 1: Create .env File

Location: `/home/u542293952/private/.env`

```env
# Database
DB_HOST=localhost
DB_NAME=u542293952_productionldm
DB_USER=u542293952_ldm
DB_PASS=your_actual_database_password

# Application
APP_URL=https://ldmcollege.com/backend
APP_PATH=/home/u542293952/public_html/backend
APP_ENV=production

# Security Keys (use the ones you generated earlier)
SESSION_KEY=your_32_char_session_key_here
JWT_SECRET=your_32_char_jwt_secret_here

# Email (Gmail SMTP example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-college-email@gmail.com
SMTP_PASS=your-app-specific-password

# Logging
ERROR_LOG=/home/u542293952/private/logs/gibbon_errors.log
```

### Step 2: Create config.php

Location: `/home/u542293952/public_html/backend/config.php`

Copy from `config.php.template` and ensure it loads the `.env` file correctly.

**CRITICAL**: The config.php must point to the correct .env location:
```php
if (file_exists(__DIR__ . '/../../private/.env')) {
    // Load .env
}
```

### Step 3: Verify .htaccess Files

**Backend .htaccess** (`/public_html/backend/.htaccess`):
- Should already exist from Gibbon
- Verify it includes security rules

**API .htaccess** (`/public_html/api/.htaccess`):
- Should be created during deployment
- Update CORS origin if needed:
  ```apache
  Header set Access-Control-Allow-Origin "https://ldmcollege.com"
  ```

---

## Part 5: PHP Configuration

### Step 1: Create php.ini (if needed)

Location: `/home/u542293952/public_html/backend/php.ini`

```ini
memory_limit = 256M
max_execution_time = 300
upload_max_filesize = 20M
post_max_size = 25M
max_input_vars = 8000
session.gc_maxlifetime = 1200
allow_url_fopen = On
```

**Note**: Some hosts use `.user.ini` instead of `php.ini`.

### Step 2: Verify PHP Version

In hPanel:
1. Go to **Advanced** → **PHP Configuration**
2. Select **PHP 8.1** or **PHP 8.2**
3. Enable required extensions:
   - ✓ curl
   - ✓ intl
   - ✓ mbstring
   - ✓ gettext
   - ✓ pdo_mysql
   - ✓ gd
   - ✓ zip

---

## Part 6: Testing & Verification

### Test 1: Backend Access

Visit: `https://ldmcollege.com/backend/`

**Expected**: Login page appears

**Common Issues**:
- **500 Error**: Check error logs, verify config.php
- **Blank page**: Enable display_errors temporarily
- **404 Error**: Check .htaccess, verify mod_rewrite

### Test 2: Login

- Username: `admin`
- Password: (the one you set in Step 4 of Part 3)

**Expected**: Redirect to admin dashboard

### Test 3: API Endpoint

```bash
curl -X POST https://ldmcollege.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

**Expected**: JSON response with token

### Test 4: Database Connection

Check backend logs for connection errors:
```bash
tail -f /home/u542293952/private/logs/gibbon_errors.log
```

### Test 5: File Upload

1. Login as admin
2. Go to User Management → Edit Profile
3. Try uploading a profile photo

**Expected**: Upload succeeds, file appears in `/uploads/`

---

## Part 7: Security Hardening

### Step 1: Force HTTPS

Ensure `.htaccess` has:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```

### Step 2: Protect Sensitive Files

Add to `/public_html/.htaccess`:
```apache
<FilesMatch "\.(env|log|sql|bak)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

### Step 3: Disable Directory Listing

```apache
Options -Indexes
```

### Step 4: Setup Automated Backups

Create cron job (in hPanel → Advanced → Cron Jobs):

```bash
# Daily database backup at 2 AM
0 2 * * * /usr/bin/mysqldump -u u542293952_ldm -p'password' u542293952_productionldm | gzip > /home/u542293952/private/backups/gibbon_$(date +\%Y\%m\%d).sql.gz
```

### Step 5: Configure Error Logging

Verify in `config.php`:
```php
'displayErrors' => false,
'logErrors' => true,
'errorLog' => '/home/u542293952/private/logs/gibbon_errors.log',
```

---

## Part 8: Post-Deployment Tasks

### Essential Configuration

1. **System Settings** (in Gibbon admin):
   - Go to System Admin → Settings
   - Set System Name: "LDM College ERP"
   - Set Organization Name: "LDM College"
   - Configure timezone: Asia/Kolkata
   - Set date format: dd/mm/yyyy

2. **Email Configuration**:
   - Test SMTP settings
   - Send test email

3. **School Year Setup**:
   - Create current academic year
   - Configure terms/semesters

4. **User Roles**:
   - Review default roles
   - Customize permissions if needed

### Create Additional Admins

Don't rely on a single admin account:

1. User Admin → Manage Users → Add
2. Create at least 2 admin accounts
3. Use strong passwords

### Monitor Performance

First week checklist:
- [ ] Check error logs daily
- [ ] Monitor page load times
- [ ] Watch database size growth
- [ ] Test with 10-20 concurrent users
- [ ] Verify backup jobs running

---

## Troubleshooting

### Issue: White Screen of Death

**Solution**:
1. Enable display_errors temporarily:
   ```php
   // Add to top of index.php
   ini_set('display_errors', 1);
   error_reporting(E_ALL);
   ```
2. Check error logs
3. Verify config.php database credentials

### Issue: Database Connection Failed

**Solution**:
1. Verify database credentials in .env
2. Check if database user has permissions:
   ```sql
   SHOW GRANTS FOR 'u542293952_ldm'@'localhost';
   ```
3. Confirm database exists and has tables

### Issue: Session Errors

**Solution**:
1. Change session handler to 'database' in config.php
2. Verify gibbonSession table exists
3. Check PHP session.save_path permissions

### Issue: File Upload Fails

**Solution**:
1. Check uploads/ directory permissions (775)
2. Verify PHP upload settings
3. Check available disk space

### Issue: API CORS Errors

**Solution**:
1. Update API .htaccess CORS origin
2. Verify mod_headers is enabled
3. Check browser console for specific error

---

## Maintenance

### Daily
- Review error logs
- Check backup status

### Weekly
- Update Gibbon (if updates available)
- Test key features
- Review user activity logs

### Monthly
- Full database backup (download to local)
- Security audit
- Performance review
- Disk space check

### Quarterly
- Review and archive old data
- Update documentation
- Security patches

---

## Support Resources

- **Gibbon Documentation**: https://docs.gibbonedu.org/
- **Community Forum**: https://ask.gibbonedu.org/
- **Hostinger Support**: https://www.hostinger.com/support
- **Your Implementation Plan**: `implementation_plan.md`

---

## Quick Reference

### Important URLs
- Backend: https://ldmcollege.com/backend/
- API: https://ldmcollege.com/api/
- phpMyAdmin: (via hPanel)

### Important Paths
- Backend: `/home/u542293952/public_html/backend/`
- API: `/home/u542293952/public_html/api/`
- Logs: `/home/u542293952/private/logs/`
- Backups: `/home/u542293952/private/backups/`

### Default Credentials
**CHANGE IMMEDIATELY AFTER FIRST LOGIN**
- Username: admin
- Password: (set during database import)

---

**Last Updated**: {{ DATE }}
**Version**: 1.0
