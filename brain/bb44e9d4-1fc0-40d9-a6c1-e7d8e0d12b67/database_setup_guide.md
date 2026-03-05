# Database Setup Guide - LDM College ERP

## Quick Start

You have two options to set up the database:

---

## Option A: Automatic (Using the Script)

**If the script is asking for password:**

1. **Enter your sudo password** in the terminal window
2. **Wait 1-2 minutes** for the import to complete
3. **Check the output** for "✅ Database setup complete!"

The script will handle everything automatically.

---

## Option B: Manual Setup (If You Prefer)

Run these commands **one at a time** in a new terminal:

### Step 1: Access MySQL
```bash
sudo mysql
```

### Step 2: Create Database and User
```sql
CREATE DATABASE IF NOT EXISTS gibbon_ldm_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ldm_api'@'localhost' IDENTIFIED BY 'ldm_api_local_123';

GRANT ALL PRIVILEGES ON gibbon_ldm_local.* TO 'ldm_api'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

### Step 3: Import the Backup
```bash
cd "/media/swastik/focus/ldm new updae 2.0"

gunzip -c ldm_production_20260201.sql.gz | sudo mysql gibbon_ldm_local
```

### Step 4: Verify Import
```bash
sudo mysql -e "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'gibbon_ldm_local';"
```

You should see a number of tables (50+).

---

## Option C: Skip Database Import

If you want to **test the frontend without database**, you can:

1. **Keep the current setup** (API running but DB incomplete)
2. **Test the frontend UI/UX** - Navigation, design, pages
3. **Fix database later** when you're ready to test login

The frontend will work fine, you just won't be able to:
- Login
- View student data
- See notices/gallery from database

---

## After Import - Test Login

Once database is imported, find your admin credentials:

```bash
# Check what usernames exist
sudo mysql -e "SELECT username FROM gibbon_ldm_local.gibbonPerson WHERE gibbonRoleIDPrimary = '001' LIMIT 5;"
```

Then test login:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD_HERE"}' | jq .
```

---

## Troubleshooting

### "Access Denied" Error
- Make sure you're using `sudo mysql` or know your root password
- Try: `sudo mysql -u root -p` and enter password when prompted

### Import Taking Too Long
- The import can take 2-5 minutes for large databases
- Don't interrupt it!

### "Table already exists" Error
- Drop the database first: `sudo mysql -e "DROP DATABASE IF EXISTS gibbon_ldm_local;"`
- Then re-run the import

---

## What's Next?

After database is imported:

1. ✅ Test login via API
2. ✅ Test login via frontend (http://localhost:5173/login)
3. ✅ Explore admin dashboard
4. 🚀 Deploy to production!
