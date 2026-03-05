# Manual Testing Checklist - LDM College CMS

## 🎯 Pre-Testing Setup

**Current Status from Automated Tests:**
- ✅ 19/24 tests passed (79%)
- ⚠️ 5 minor issues to verify
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend: http://localhost:8000/api

**Issues to Address:**
1. Admin user permissions not assigned (we'll test this)
2. Audit logs retrieval (we'll verify)
3. ImageMagick not installed (not critical for deployment)

---

## 📝 Testing Checklist

### 1. Frontend Homepage ✓

**Currently:** Browser already open at http://localhost:5173/login

**Test Steps:**
1. Click browser back button or go to http://localhost:5173
2. Verify homepage loads with:
   - Navigation menu (Home, About, Courses, etc.)
   - Hero section/banner
   - No JavaScript errors (F12 → Console)

**Expected Result:** Beautiful homepage, no console errors

**Status:** [ ] Pass [ ] Fail

---

### 2. User Authentication ✓

**Test Steps:**
1. You're already on the login page
2. Enter credentials:
   - **Username:** `admin`
   - **Password:** `password`
3. Click **Sign In** button
4. Check if you're redirected after login

**Expected Result:** 
- Login successful
- Redirected to home/dashboard
- Welcome message or user indicator visible

**Status:** [ ] Pass [ ] Fail

**Notes:** _____________________

---

### 3. Navigation & Pages

**Test Each Page:**

#### a) Gallery Page
- **URL:** http://localhost:5173/gallery
- **Check:** Page loads, shows gallery grid
- **Note:** May be empty (0 images uploaded yet)
- **Status:** [ ] Pass [ ] Fail

#### b) Notices Page
- **URL:** http://localhost:5173/notices
- **Check:** Page loads, shows 2 test notices created by automated script
- **Notices should show:**
  - "Test Notice - Automated"
  - "Exam Schedule Released" (if from earlier)
- **Status:** [ ] Pass [ ] Fail

#### c) Contact Page
- **URL:** http://localhost:5173/contact
- **Check:** Contact form displays with fields:
  - Name, Email, Phone, Subject, Message
  - Submit button present
- **Status:** [ ] Pass [ ] Fail

#### d) About Page
- **URL:** http://localhost:5173/about
- **Check:** Page loads correctly
- **Status:** [ ] Pass [ ] Fail

#### e) Courses Page
- **URL:** http://localhost:5173/courses
- **Check:** Page loads correctly
- **Status:** [ ] Pass [ ] Fail

---

### 4. Contact Form Submission

**Test Steps:**
1. Go to Contact page
2. Fill out form:
   ```
   Name: Manual Test User
   Email: manual@test.com
   Phone: +91-9999999999
   Subject: Manual Testing
   Message: This is a manual test of the contact form.
   ```
3. Click **Submit**
4. Check for success message

**Expected Result:** 
- Success message appears
- Form clears or shows confirmation
- No errors in browser console

**Status:** [ ] Pass [ ] Fail

**Verify in Database (Optional):**
```bash
sudo mysql gibbon_ldm_local -e "SELECT id, name, subject, status FROM contact_messages ORDER BY id DESC LIMIT 3;"
```

---

### 5. Admin Dashboard (If Available)

**Test Steps:**
1. Look for "Admin" or "Dashboard" link in navigation
2. Click it
3. Check if statistics display

**Expected to See:**
- Student count
- Staff count  
- Notice count
- Contact messages count
- Gallery count

**Status:** [ ] Pass [ ] Fail [ ] N/A (Not visible)

**Note:** If admin features aren't visible, that's okay - might need frontend updates

---

### 6. API Testing (Backend)

Open a new terminal and run these curl commands:

#### a) Test API Health
```bash
curl http://localhost:8000/api/health | jq
```

**Expected:** Should return JSON with status (even if "degraded" is fine)

**Status:** [ ] Pass [ ] Fail

#### b) Test Login API
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq
```

**Expected:** Should return JWT token and user info

**Status:** [ ] Pass [ ] Fail

#### c) Test Public Notices
```bash
curl http://localhost:8000/api/notices | jq
```

**Expected:** Should return list of notices (2 test notices)

**Status:** [ ] Pass [ ] Fail

#### d) Test Public Gallery
```bash
curl http://localhost:8000/api/gallery | jq
```

**Expected:** Should return empty array [] or images if any uploaded

**Status:** [ ] Pass [ ] Fail

---

### 7. Database Verification

Run these commands to verify database state:

#### a) Contact Messages
```bash
sudo mysql gibbon_ldm_local -e "SELECT COUNT(*) as total FROM contact_messages;"
```
**Expected:** Should show at least 2-3 messages

**Status:** [ ] Pass [ ] Fail

#### b) Notices
```bash
sudo mysql gibbon_ldm_local -e "SELECT id, title, is_active FROM notices;"
```
**Expected:** Should show 1-2 test notices

**Status:** [ ] Pass [ ] Fail

#### c) Audit Logs
```bash
sudo mysql gibbon_ldm_local -e "SELECT COUNT(*) as total FROM audit_logs;"
```
**Expected:** Should show 0 or more (audit logging needs to be triggered)

**Status:** [ ] Pass [ ] Fail

#### d) Permissions
```bash
sudo mysql gibbon_ldm_local -e "SELECT permission_key FROM permission_definitions LIMIT 5;"
```
**Expected:** Should show 5 permissions (manage_users, manage_roles, etc.)

**Status:** [ ] Pass [ ] Fail

---

### 8. File Upload Test (Critical for Gallery)

**Test Steps:**
1. Find a JPG/PNG image on your computer (or download one)
2. Open terminal:

```bash
cd "/media/swastik/focus/ldm new updae 2.0"

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token')

# Upload image (replace path/to/image.jpg with your image)
curl -X POST http://localhost:8000/api/admin/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/your/image.jpg" \
  -F "title=Test Upload" \
  -F "description=Manual test upload" \
  -F "category=general" | jq
```

**Expected:**
- Success message with image ID
- Check uploads folder:
```bash
ls -la public/uploads/gallery/originals/
ls -la public/uploads/gallery/thumbnails/
ls -la public/uploads/gallery/medium/
```
- Should see 3 versions of the image

**Status:** [ ] Pass [ ] Fail

---

### 9. Responsive Design Check

**Test Different Screen Sizes:**

1. **Desktop (Full Screen)** - Current view
   - Status: [ ] Pass [ ] Fail

2. **Tablet (Resize browser to ~768px width)**
   - Navigation adapts
   - Layout responsive
   - Status: [ ] Pass [ ] Fail

3. **Mobile (Resize to ~375px width)**
   - Mobile menu appears
   - Content stacks vertically
   - Status: [ ] Pass [ ] Fail

Use browser DevTools (F12) → Toggle device toolbar

---

### 10. Security & Performance

#### a) HTTPS Redirect Test
**Local:** Not applicable (using http://)
**Production:** Will force HTTPS via .htaccess

**Status:** [ ] N/A local [ ] Will test on Hostinger

#### b) Rate Limiting (Contact Form)
Try submitting contact form 4 times quickly:

**Expected:** After 3 submissions, should get rate limit error

**Status:** [ ] Pass [ ] Fail [ ] Skip

#### c) Page Load Speed
**Check:** Pages should load in < 2 seconds

**Status:** [ ] Pass [ ] Fail

---

## 🐛 Known Issues from Automated Tests

### ⚠️ Issue 1: Admin Permissions Not Assigned
**Impact:** Admin user has 0 permissions
**Fix:**
```bash
sudo mysql gibbon_ldm_local -e "UPDATE gibbonRole SET permissions = JSON_ARRAY('manage_users', 'manage_roles', 'manage_content', 'manage_gallery', 'manage_notices', 'view_audit_logs', 'manage_settings', 'manage_students', 'manage_staff', 'view_contact_messages') WHERE gibbonRoleID = '001';"
```

**After Fix, Test:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token')

curl http://localhost:8000/api/auth/user-permissions \
  -H "Authorization: Bearer $TOKEN" | jq
```
**Expected:** Should show 10 permissions

---

### ⚠️ Issue 2: Audit Logging Not Working
**Status:** Needs investigation
**Quick Test:**
```bash
# Login and check audit logs
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token')

curl "http://localhost:8000/api/admin/audit-logs?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**If fails:** Apply permissions fix above first

---

### ⚠️ Issue 3: ImageMagick Not Installed
**Impact:** Can't auto-generate test images in scripts
**Fix (Optional):**
```bash
sudo apt-get install imagemagick
```

**Not critical** - manual image upload works fine

---

## ✅ Final Checklist Before Deployment

- [ ] All frontend pages load without errors
- [ ] Login/logout works
- [ ] Contact form submits successfully
- [ ] Notices display on frontend
- [ ] Gallery page renders (even if empty)
- [ ] API health check returns response
- [ ] Database tables all exist
- [ ] Upload directories exist and are writable
- [ ] At least 1 test image uploaded successfully
- [ ] Admin permissions fixed (10 permissions assigned)
- [ ] No critical errors in browser console
- [ ] No critical errors in API responses

**Pass Criteria:** At least 90% of items checked ✅

---

## 📊 Test Results Summary

**Date:** _____________  
**Tested By:** _____________

**Frontend Tests:** ___/6 passed  
**API Tests:** ___/4 passed  
**Database Tests:** ___/4 passed  
**File Upload:** ___/1 passed  
**Responsive:** ___/3 passed

**Overall Pass Rate:** ____%

**Ready for Deployment?** [ ] YES [ ] NO

**Issues Found:**
1. _____________________
2. _____________________
3. _____________________

---

## 🚀 Next Steps After Testing

### If All Tests Pass:
```bash
# 1. Fix admin permissions
sudo mysql gibbon_ldm_local -e "UPDATE gibbonRole SET permissions = JSON_ARRAY('manage_users', 'manage_roles', 'manage_content', 'manage_gallery', 'manage_notices', 'view_audit_logs', 'manage_settings', 'manage_students', 'manage_staff', 'view_contact_messages') WHERE gibbonRoleID = '001';"

# 2. Run deployment preparation
./prepare_deployment.sh

# 3. Follow deployment guide
# See: quick_deployment.md
```

### If Tests Fail:
1. Note which tests failed
2. Check browser console for errors (F12)
3. Check API logs
4. Fix issues
5. Re-test
6. Repeat until all critical tests pass

---

## 📞 Quick Reference

**Frontend:** http://localhost:5173  
**API:** http://localhost:8000/api  
**Login:** admin / password

**Common Commands:**
```bash
# Check API status
curl http://localhost:8000/api/health | jq

# Get auth token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token'

# View recent logs
tail -f /var/log/apache2/error.log
```

---

**Happy Testing! 🧪**
