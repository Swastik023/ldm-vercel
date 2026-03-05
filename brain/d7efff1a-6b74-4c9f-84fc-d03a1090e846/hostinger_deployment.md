# Hostinger Deployment Guide - LDM College CMS

## 📋 Pre-Deployment Checklist

- [ ] Hostinger account with cPanel access
- [ ] Domain: ldmcollege.com pointed to Hostinger
- [ ] MySQL database created on Hostinger
- [ ] FTP/File Manager access
- [ ] Local site fully tested and working

---

## Step 1: Export Local Database

### 1.1 Export Database
```bash
cd "/media/swastik/focus/ldm new updae 2.0"

# Export complete database
sudo mysqldump gibbon_ldm_local > ldm_production_$(date +%Y%m%d).sql

# Compress for faster upload
gzip ldm_production_$(date +%Y%m%d).sql
```

**Output:** `ldm_production_20260201.sql.gz`

### 1.2 Verify Export
```bash
# Check file size
ls -lh ldm_production_*.sql.gz

# Should be several MB
```

---

## Step 2: Prepare Files for Upload

### 2.1 Create Production Build (Frontend)
```bash
cd ldm_test

# Build production React app
npm run build

# Output will be in ldm_test/dist/
```

### 2.2 Prepare API Files
```bash
cd /media/swastik/focus/ldm\ new\ updae\ 2.0

# Create deployment package
mkdir -p deploy_package
cp -r api deploy_package/
cp -r database deploy_package/
mkdir -p deploy_package/public/uploads/gallery/{originals,thumbnails,medium}

# Copy frontend build
cp -r ldm_test/dist/* deploy_package/public/

# Create .htaccess for root
cat > deploy_package/public/.htaccess << 'EOF'
# Enable Rewrite
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API Routing
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ /api/index.php [QSA,L]

# Frontend Routing (React)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF
```

### 2.3 Update API Configuration for Production
```bash
# Edit api/index.php before uploading
nano deploy_package/api/index.php
```

**Find and update these lines (around line 43-47):**
```php
// Database Configuration - UPDATE FOR PRODUCTION
$db_host = 'localhost';
$db_name = 'u542293952_gibbon_ldm';  // Your Hostinger DB name
$db_user = 'u542293952_ldm_api';      // Your Hostinger DB user
$db_pass = 'YOUR_STRONG_PASSWORD';    // Your DB password

// JWT Secret - CHANGE THIS!
$jwtSecret = 'CHANGE_THIS_TO_RANDOM_64_CHAR_STRING';
```

**Generate new JWT secret:**
```bash
openssl rand -hex 32
# Use this output as your jwtSecret
```

---

## Step 3: Hostinger Database Setup

### 3.1 Create Database (via cPanel)
1. Login to Hostinger cPanel
2. Go to **MySQL Databases**
3. Create new database: `u542293952_gibbon_ldm`
4. Create new user: `u542293952_ldm_api`
5. Set strong password
6. Add user to database with **ALL PRIVILEGES**

### 3.2 Import Database
1. Go to **phpMyAdmin** in cPanel
2. Select your database `u542293952_gibbon_ldm`
3. Click **Import** tab
4. Upload `ldm_production_20260201.sql.gz`
5. Click **Go**
6. Wait for import to complete (may take 1-2 minutes)

### 3.3 Verify Import
```sql
-- Run in phpMyAdmin SQL tab
SHOW TABLES;
-- Should show all Gibbon tables + audit_logs, contact_messages, notices, gallery, permission_definitions

SELECT COUNT(*) FROM gibbonPerson;
-- Should show your admin user
```

---

## Step 4: Upload Files to Hostinger

### Option A: File Manager (Recommended for beginners)

1. Login to Hostinger cPanel
2. Open **File Manager**
3. Navigate to `/public_html/ldmcollege.com/`
4. Upload `deploy_package` folder contents:
   - Upload `api/` folder
   - Upload `public/` folder contents to root
   - Upload `database/` folder (optional, for reference)

### Option B: FTP (FileZilla)

**FTP Credentials (from Hostinger):**
- Host: `ftp.ldmcollege.com` or IP
- Username: `u542293952`
- Password: Your Hostinger password
- Port: 21

**Upload Structure:**
```
/public_html/ldmcollege.com/
├── api/                    # API folder
│   ├── index.php
│   ├── AuditLogger.php
│   ├── PermissionManager.php
│   ├── ImageUploader.php
│   ├── helpers.php
│   ├── Validator.php
│   └── vendor/            # Composer dependencies
├── uploads/                # File upload directory
│   └── gallery/
│       ├── originals/
│       ├── thumbnails/
│       └── medium/
├── index.html             # React app entry
├── assets/                # React compiled assets
├── .htaccess             # Routing rules
└── favicon.ico
```

---

## Step 5: Set File Permissions

### Via File Manager:
1. Right-click `api/` folder → Permissions
2. Set to `755` (rwxr-xr-x)
3. Right-click `uploads/` folder → Permissions
4. Set to `755` (rwxr-xr-x) - **RECURSIVE**

### Via SSH (if available):
```bash
ssh u542293952@ldmcollege.com

cd public_html/ldmcollege.com
chmod -R 755 api/
chmod -R 755 uploads/
chmod 644 api/index.php
find uploads/ -type f -exec chmod 644 {} \;
```

---

## Step 6: Configure Composer Dependencies

### Option A: Upload vendor folder (Easier)
```bash
# On local machine
cd deploy_package/api
composer install --no-dev --optimize-autoloader

# Then upload the entire api/vendor/ folder via FTP
```

### Option B: Install via SSH (if available)
```bash
ssh u542293952@ldmcollege.com
cd public_html/ldmcollege.com/api
composer install --no-dev --optimize-autoloader
```

---

## Step 7: Update Environment URLs

### 7.1 Verify API Base URL
Your API will be at: `https://ldmcollege.com/api/`

### 7.2 Update CORS Headers (if needed)
Edit `api/index.php` (line 11):
```php
header('Access-Control-Allow-Origin: https://ldmcollege.com');
```

---

## Step 8: Testing Deployment

### 8.1 Test API Endpoints
```bash
# Test health check
curl https://ldmcollege.com/api/health

# Test login
curl -X POST https://ldmcollege.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Should return JWT token
```

### 8.2 Test Frontend
1. Open browser: `https://ldmcollege.com`
2. Should load React app
3. Click **Login** → Use admin credentials
4. Should successfully authenticate
5. Check **Admin Dashboard** → Should show stats
6. Try uploading a gallery image

### 8.3 Test Gallery Upload
```bash
# Get token
TOKEN=$(curl -s -X POST https://ldmcollege.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token')

# Upload test image
curl -X POST https://ldmcollege.com/api/admin/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test_image.jpg" \
  -F "title=Test Upload" \
  -F "description=Testing from production"
```

---

## Step 9: SSL Certificate

### Enable HTTPS (Hostinger)
1. Go to cPanel → **SSL/TLS Status**
2. Find `ldmcollege.com`
3. Click **Run AutoSSL**
4. Wait for SSL to activate (5-10 minutes)
5. Test: `https://ldmcollege.com`

**Force HTTPS:** Already configured in `.htaccess`

---

## Step 10: Create Admin User (if needed)

If you need to create a new admin user on production:

```sql
-- Run in phpMyAdmin
INSERT INTO gibbonPerson 
(username, passwordStrong, gibbonRoleIDPrimary, surname, preferredName, 
 email, status, canLogin, passwordForceReset)
VALUES 
('admin', '$2y$10$...', '001', 'Administrator', 'Admin', 
 'admin@ldmcollege.com', 'Full', 'Y', 'N');

-- Password hash for 'password' (CHANGE THIS!)
-- Generate: php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT);"
```

---

## Troubleshooting

### Issue: 500 Internal Server Error
**Fix:**
1. Check `api/index.php` - PHP syntax error
2. Check file permissions (755 for folders, 644 for files)
3. Check Composer vendor folder exists
4. Enable error display temporarily:
   ```php
   // Top of api/index.php
   ini_set('display_errors', 1);
   error_reporting(E_ALL);
   ```

### Issue: API returns empty response
**Fix:**
1. Check `.htaccess` rewrite rules
2. Verify API path in cPanel: `/public_html/ldmcollege.com/api/`
3. Check Apache mod_rewrite is enabled

### Issue: Database connection failed
**Fix:**
1. Verify database credentials in `api/index.php`
2. Check database exists in cPanel MySQL
3. Verify user has ALL PRIVILEGES

### Issue: Image upload fails
**Fix:**
1. Check `uploads/` folder exists
2. Check folder permissions (755)
3. Check PHP upload limits:
   ```php
   // In php.ini or .htaccess
   upload_max_filesize = 10M
   post_max_size = 10M
   ```

### Issue: Frontend routes don't work
**Fix:**
1. Verify `.htaccess` in public root
2. Check mod_rewrite enabled
3. Test direct file access: `ldmcollege.com/assets/index-*.js`

---

## Post-Deployment Checklist

- [ ] SSL certificate active (https://)
- [ ] Login working
- [ ] Admin dashboard displays stats
- [ ] Gallery upload functional
- [ ] Notices displaying correctly
- [ ] Contact form submitting
- [ ] Audit logs recording actions
- [ ] File permissions correct (755/644)
- [ ] Database backed up
- [ ] Admin password changed from default

---

## Backup Strategy

### Automated Backups
```bash
# Add to cron job (cPanel → Cron Jobs)
# Every day at 2 AM
0 2 * * * mysqldump -u u542293952_ldm_api -p'PASSWORD' u542293952_gibbon_ldm | gzip > ~/backups/ldm_$(date +\%Y\%m\%d).sql.gz

# Keep last 7 days
0 3 * * * find ~/backups/ -name "ldm_*.sql.gz" -mtime +7 -delete
```

### Manual Backup
1. cPanel → **Backup Wizard**
2. Select **Full Backup**
3. Download to local machine
4. Store securely

---

## Maintenance Commands

### Clear Audit Logs (90+ days old)
```sql
DELETE FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Check Database Size
```sql
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'u542293952_gibbon_ldm'
ORDER BY (data_length + index_length) DESC;
```

### Monitor Upload Directory
```bash
du -sh ~/public_html/ldmcollege.com/uploads/
```

---

## Quick Deployment Script

Save this as `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 LDM College Deployment Script"
echo "================================"

# 1. Export database
echo "📦 Exporting database..."
sudo mysqldump gibbon_ldm_local | gzip > ldm_production_$(date +%Y%m%d).sql.gz

# 2. Build frontend
echo "🔨 Building frontend..."
cd ldm_test
npm run build
cd ..

# 3. Create package
echo "📁 Creating deployment package..."
rm -rf deploy_package
mkdir -p deploy_package
cp -r api deploy_package/
mkdir -p deploy_package/public/uploads/gallery/{originals,thumbnails,medium}
cp -r ldm_test/dist/* deploy_package/public/

# 4. Create .htaccess
cat > deploy_package/public/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ /api/index.php [QSA,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF

echo "✅ Deployment package ready!"
echo "📍 Location: ./deploy_package/"
echo "📍 Database: ./ldm_production_$(date +%Y%m%d).sql.gz"
echo ""
echo "Next steps:"
echo "1. Update database credentials in deploy_package/api/index.php"
echo "2. Upload deploy_package contents to Hostinger"
echo "3. Import database to Hostinger phpMyAdmin"
echo "4. Test: https://ldmcollege.com/api/health"
```

Run with:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Support

**Hostinger Support:** https://support.hostinger.com  
**cPanel Documentation:** https://docs.cpanel.net

**Common Hostinger Paths:**
- Public directory: `/home/u542293952/public_html/ldmcollege.com/`
- Logs: `/home/u542293952/logs/`
- PHP version: cPanel → **Select PHP Version**

---

**Deployment Complete!** 🎉

Your CMS should now be live at: **https://ldmcollege.com**
