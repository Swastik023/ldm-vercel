# PHP Backend Deliverables Walkthrough

This document serves as the final report and user manual for the PHP backend migration.

## 📂 Deliverables Overview

All files are located in the `php_backend` directory.

### 1. Database Schema & Explanation
**File:** `php_backend/sql/schema.sql`

This script creates the necessary normalized tables:
- **`users`**: Stores login credentials and roles (admin, teacher, student, employee).
- **`notices`**: Stores announcements. Linked to `users` via `author_id` (Foreign Key).
- **`notifications`**: Stores alerts. Linked to `users` via `user_id` (Foreign Key). :cascade delete enabled.

**Setup:**
1. Log in to your Hostinger **phpMyAdmin**.
2. Select your database.
3. Use the **Import** tab to upload and run `php_backend/sql/schema.sql`.

### 2. Configuration
**File:** `php_backend/config/db.php`

Contains the secure `PDO` connection logic.
- **Action Required**: Open this file and edit `DB_USER`, `DB_PASS`, and `DB_NAME` with your actual Hostinger database credentials.
- **Security**: Includes `HttpOnly` and `Secure` session cookie flags for better security.

### 3. Core Logic
- **`includes/auth.php`**: Middleware that enforces login checks (`require_login()`) and role checks (`require_role('admin')`).
- **`includes/functions.php`**: Helper functions for input sanitization (`sanitize_input`) and creating notifications (`notify_all_users`).

### 4. Application Pages
- **Login**: `php_backend/login.php` - Central login entry point. Redirects users to their specific dashboard based on role.
- **Admin Panel**: `php_backend/admin/dashboard.php` - Allows creating notices and viewing system stats.
- **Teacher Panel**: `php_backend/teacher/dashboard.php` - Allows submitting notices.
- **Student/Employee Panel**: `php_backend/student/dashboard.php` - View notices and notifications.

## 🚀 How to Deploy on Hostinger

### Critical Update (V5)
The **Service Worker (PWA)** was removing the ability to access the backend. **Use `final_deploy_v5.zip`** which has this disabled.

1. **Delete** all files in `public_html`.
2. **Upload** `final_deploy_v5.zip`.
3. **Extract**.
4. **Important**: Open your site in an **Incognito Window** to clear the old cache.

> [!IMPORTANT]
> Change the default admin password immediately after logging in.
