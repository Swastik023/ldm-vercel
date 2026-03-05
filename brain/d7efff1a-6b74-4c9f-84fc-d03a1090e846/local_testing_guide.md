# Local Development & Testing Guide

## Complete Setup for Testing Frontend ↔ Backend Locally

This guide walks you through setting up and testing the LDM College ERP API and frontend **locally** before deploying to Hostinger.

---

## 📁 Project Structure

```
/media/swastik/focus/ldm new updae 2.0/
├── api/                              # Custom REST API (Slim 4)
│   ├── index.php                     # Main API file
│   ├── .htaccess                     # Security & routing
│   ├── Cache.php, Validator.php, etc.
│  
├── testbackend/core-31.0.00/         # Gibbon ERP Installation
│   ├── index.php                     # Gibbon main entry
│   ├── config.php                    # Database config
│   ├── modules/                      # Gibbon modules
│
├── frontend_integration/              # Frontend Example Files
│   ├── api.ts                        # API client (TypeScript)
│   ├── Login.tsx                     # Login component
│   └── StudentDashboard.tsx          # Dashboard
│
├── ldm_test/                         # Website Frontend (Vite)
│   ├── src/
│   ├── package.json
│   └── .env
│
└── scripts/                          # Testing scripts
    └── test_frontend_integration.sh
```

---

## Step 1: Start Local PHP Server

### Option A: Using PHP Built-in Server (Recommended for Testing)

Open a terminal and run:

```bash
cd "/media/swastik/focus/ldm new updae 2.0"

# Start PHP server on port 8000
php -S localhost:8000
```

This will serve from the project root. Your API will be accessible at:
- `http://localhost:8000/api/`
- Gibbon ERP at: `http://localhost:8000/testbackend/core-31.0.00/`

> [!TIP]
> Keep this terminal window open. The server must run while testing.

### Option B: Using Apache/XAMPP/LAMP

If you have Apache installed:

1. **Create a symlink or copy project to Apache's htdocs:**
   ```bash
   sudo ln -s "/media/swastik/focus/ldm new updae 2.0" /var/www/html/ldm
   ```

2. **Access via:**
   - API: `http://localhost/ldm/api/`
   - Gibbon: `http://localhost/ldm/testbackend/core-31.0.00/`

---

## Step 2: Configure Database

### Check Existing Configuration

1. **Look for existing config.php:**
   ```bash
   ls testbackend/core-31.0.00/config.php
   ```

2. **If it doesn't exist, create from template:**
   ```bash
   cp testbackend/core-31.0.00/config.php.template \
      testbackend/core-31.0.00/config.php
   ```

3. **Edit config.php:**
   ```bash
   nano testbackend/core-31.0.00/config.php
   ```

4. **Set your local database credentials:**
   ```php
   $databaseServer = 'localhost';
   $databaseName   = 'gibbon_ldm';        # Your local DB name
   $databaseUsername = 'root';             # Your MySQL user
   $databasePassword = '';                 # Your MySQL password
   ```

### Import Database

If you haven't imported the Gibbon database yet:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE gibbon_ldm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p gibbon_ldm < testbackend/core-31.0.00/gibbon.sql

# OR import demo data:
mysql -u root -p gibbon_ldm < testbackend/core-31.0.00/gibbon_demo.sql
```

---

## Step 3: Configure CORS for Local Development

The `.htaccess` in `/api/` already has CORS headers configured. Verify they're present:

```bash
grep -A 10 "CORS" api/.htaccess
```

You should see:
```apache
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept"
```

✅ **No changes needed** - CORS is already configured!

---

## Step 4: Test Backend API

### Test 1: Health Check

Open browser or use curl:

```bash
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-01 07:15:20",
  "checks": {
    "database": {"status": "ok"},
    "cache": {"status": "ok"}
  }
}
```

### Test 2: Login Endpoint

Get Gibbon credentials first. Default admin credentials (if using demo data):
- Username: `admin`
- Password: `gibbon`

Test login:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"gibbon"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "1",
      "username": "admin",
      "name": "Administrator",
      "role": "Admin"
    }
  }
}
```

### Test 3: Protected Endpoint (Students)

Using the token from login:

```bash
TOKEN="your_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/students?page=1&limit=5
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 150
  },
  "cached": false
}
```

---

## Step 5: Configure Frontend

### Option A: Using frontend_integration Files (Quick Test)

The files in `/frontend_integration/` are ready to use with any React project.

**API URL is already configured** ✅

Check `frontend_integration/api.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/api';
```

This will automatically use:
- `http://localhost/api` in development
- Or whatever you set in `.env` file

### Option B: Using vite Project (ldm_test)

If testing with the ldm_test website:

1. **Install dependencies (if not done):**
   ```bash
   cd ldm_test
   npm install
   ```

2. **Environment is already configured** ✅

   Check `ldm_test/.env`:
   ```env
   VITE_API_URL=http://localhost/api
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

This will start Vite dev server, typically at: `http://localhost:5173`

---

## Step 6: Test Frontend → Backend Integration

### Using Browser Developer Tools

1. **Open frontend in browser**
2. **Press F12** to open DevTools
3. **Go to Network tab**
4. **Try to login** (if you've integrated Login.tsx)
5. **Watch the network requests:**

Expected requests:
```
POST http://localhost:8000/api/auth/login
Status: 200 OK
Response: {success: true, data: {...}}
```

### Check for CORS Errors

In the Console tab, you should **NOT** see:
```
❌ Access to fetch at 'http://localhost:8000/api/auth/login' 
   from origin 'http://localhost:5173' has been blocked by CORS policy
```

If you see CORS errors:
1. Verify `.htaccess` CORS headers are present
2. Restart PHP server
3. Clear browser cache

---

## Step 7: Run Automated Integration Tests

Use the test script:

```bash
cd "/media/swastik/focus/ldm new updae 2.0"

# Make executable
chmod +x scripts/test_frontend_integration.sh

# Run tests (basic)
./scripts/test_frontend_integration.sh

# Run with credentials
TEST_PASSWORD=gibbon ./scripts/test_frontend_integration.sh
```

**Expected Output:**
```
Test 1: Health Check Endpoint
  ✓ PASS - Health endpoint accessible (HTTP 200)

Test 2: CORS Headers
  ✓ PASS - CORS headers present

Test 3: Login Endpoint
  ✓ PASS - Login successful
  Token received: eyJ0eXAiOiJKV1QiLCJhbGc...

Test 4: Authenticated Request (Students List)
  ✓ PASS - Students endpoint accessible
  Students returned: 5
  Total students: 150
```

---

## Step 8: Create a Simple Test Page

Create a quick HTML test page:

```bash
cat > test_login.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>API Test</title>
</head>
<body>
    <h1>LDM College API Test</h1>
    
    <div>
        <input type="text" id="username" placeholder="Username" value="admin">
        <input type="password" id="password" placeholder="Password" value="gibbon">
        <button onclick="testLogin()">Login</button>
    </div>
    
    <div id="result"></div>
    
    <script>
        async function testLogin() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const resultDiv = document.getElementById('result');
            
            try {
                const response = await fetch('http://localhost:8000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                
                if (data.success && data.data.token) {
                    localStorage.setItem('token', data.data.token);
                    testStudents(data.data.token);
                }
            } catch (error) {
                resultDiv.innerHTML = '<p style="color:red">Error: ' + error.message + '</p>';
            }
        }
        
        async function testStudents(token) {
            try {
                const response = await fetch('http://localhost:8000/api/students?limit=3', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                const data = await response.json();
                document.getElementById('result').innerHTML += 
                    '<h3>Students:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                console.error('Students fetch error:', error);
            }
        }
    </script>
</body>
</html>
EOF
```

Then open it:
```bash
xdg-open test_login.html
# or
firefox test_login.html
```

---

## Troubleshooting

### Issue 1: "Connection Refused"

**Error:** `Failed to fetch` or `Connection refused`

**Solutions:**
1. Verify PHP server is running
2. Check the port (should be 8000)
3. Make sure API URL matches server

### Issue 2: "404 Not Found"

**Error:** `http://localhost:8000/api/students` returns 404

**Solutions:**
1. Check `.htaccess` exists in `/api/` folder
2. Verify `mod_rewrite` is enabled
3. Try accessing: `http://localhost:8000/api/index.php/students`

### Issue 3: Database Connection Failed

**Error:** Health check shows `"database": {"status": "error"}`

**Solutions:**
1. Check MySQL/MariaDB is running: `sudo systemctl status mysql`
2. Verify credentials in `config.php`
3. Test database connection:
   ```bash
   mysql -u root -p -e "USE gibbon_ldm; SELECT COUNT(*) FROM gibbonPerson;"
   ```

### Issue 4: CORS Still Blocked

**Error:** CORS errors in browser console

**Solutions:**
1. Ensure `.htaccess` CORS section exists
2. Check Apache has `mod_headers` enabled:
   ```bash
   sudo a2enmod headers
   sudo systemctl restart apache2
   ```
3. For PHP built-in server, CORS should work automatically

### Issue 5: JWT Token Invalid

**Error:** `401 Unauthorized` on protected endpoints

**Solutions:**
1. Verify token is being sent: Check Network tab → Headers
2. Check JWT secret matches in `api/index.php`
3. Token might be expired (default: 1 hour)

---

## Testing Checklist

Use this to verify everything works:

### Backend Tests
- [ ] PHP server is running
- [ ] `/api/health` returns 200 OK
- [ ] Database check passes in health response
- [ ] Login with valid credentials succeeds
- [ ] Login returns JWT token
- [ ] Students endpoint works with token

### Frontend Tests
- [ ] Frontend dev server is running
- [ ] Can access frontend in browser
- [ ] No CORS errors in console
- [ ] Login form submits successfully
- [ ] Token is stored (localStorage/sessionStorage)
- [ ] Dashboard loads student data
- [ ] Network tab shows successful API calls

### Integration Tests
- [ ] `test_frontend_integration.sh` passes all tests
- [ ] Can login from frontend
- [ ] Can view students list
- [ ] Can view individual student details
- [ ] Cache is working (check `"cached": true` in responses)

---

## Quick Commands Reference

### Start Everything

```bash
# Terminal 1: Backend
cd "/media/swastik/focus/ldm new updae 2.0"
php -S localhost:8000

# Terminal 2: Frontend (if using ldm_test)
cd "/media/swastik/focus/ldm new updae 2.0/ldm_test"
npm run dev

# Terminal 3: Run tests
cd "/media/swastik/focus/ldm new updae 2.0"
TEST_PASSWORD=gibbon ./scripts/test_frontend_integration.sh
```

### Quick URL Access

- **Health Check:** http://localhost:8000/api/health
- **Gibbon Login:** http://localhost:8000/testbackend/core-31.0.00/
- **Frontend:** http://localhost:5173 (Vite default)
- **Test Page:** Open `test_login.html` in browser

---

## Environment Comparison

| Environment | API URL | CORS | Database |
|-------------|---------|------|----------|
| **Local** | `http://localhost:8000/api` | Allow `*` | Local MySQL |
| **Staging** | `https://staging.ldmcollege.com/api` | Specific origin | Staging DB |
| **Production** | `https://ldmcollege.com/api` | `ldmcollege.com` only | Production DB |

---

## Next Steps After Local Testing

Once everything works locally:

1. ✅ All tests passing
2. ✅ Login works
3. ✅ Students list loads
4. ✅ No CORS errors

**Then proceed to:**
1. Deploy backend to Hostinger
2. Update frontend API URL to production
3. Test on production
4. Setup backups and monitoring

---

## Summary

**To test locally:**

```bash
# 1. Start backend
php -S localhost:8000

# 2. Test health
curl http:// localhost:8000/api/health

# 3. Test login (in browser or via curl)
# 4. Check frontend can connect (no CORS errors)
```

**Key configuration files:**
- `/api/.htaccess` - CORS headers ✅
- `/frontend_integration/api.ts` - API URL ✅
- `/ldm_test/.env` - Vite API URL ✅
- `/testbackend/core-31.0.00/config.php` - Database ⚠️ (configure manually)

**Everything is ready for local testing!** 🚀
