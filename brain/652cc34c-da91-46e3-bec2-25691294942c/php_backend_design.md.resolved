# PHP/MySQL Backend migration Plan

This document outlines the architecture for converting the static site to a dynamic PHP application hosted on Hostinger.

## 1. Database Design (MySQL)

We will use a normalized schema with `InnoDB` engine for relational integrity.

### Schema Overview

#### `users` table
Stores all user accounts (Admin, Teacher, Student, Employee).
- **id**: INT, PK, Auto Increment
- **username**: VARCHAR(50), Unique
- **email**: VARCHAR(100), Unique
- **password**: VARCHAR(255) (Hashed)
- **role**: ENUM('admin', 'teacher', 'student', 'employee')
- **is_active**: BOOLEAN (Default 1)
- **created_at**: TIMESTAMP

#### `notices` table
Stores announcements/notices.
- **id**: INT, PK, Auto Increment
- **title**: VARCHAR(255)
- **content**: TEXT
- **author_id**: INT, FK -> users.id
- **status**: ENUM('draft', 'published', 'archived')
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

#### `notifications` table
System notifications for users.
- **id**: INT, PK, Auto Increment
- **user_id**: INT, FK -> users.id
- **message**: VARCHAR(255)
- **is_read**: BOOLEAN (Default 0)
- **created_at**: TIMESTAMP

## 2. Folder Structure

We will use a modular structure to keep logic separate from presentation (even without a framework).

```text
php_backend/
├── config/
│   └── db.php           # Database connection (PDO)
├── includes/
│   ├── functions.php    # Common helper functions (sanitization, notifications)
│   └── auth.php         # Authentication middleware (role checks)
├── public/              # Web root (if possible, otherwise just root)
│   ├── admin/
│   │   ├── dashboard.php
│   │   ├── users.php
│   │   └── notices.php
│   ├── teacher/
│   │   └── dashboard.php
│   ├── student/
│   │   └── dashboard.php
│   ├── login.php
│   ├── logout.php
│   └── index.php
└── sql/
    └── schema.sql       # Database creation script
```

## 3. Security Measures

- **PDO & Prepared Statements**: STRICT enforcement for all queries to prevent SQL Injection.
- **Password Security**: `password_hash()` (Bcrypt) and `password_verify()`.
- **Session Security**:
    - `session_regenerate_id(true)` on login to prevent fixation.
    - HTTPOnly and Secure cookie flags (configured in `db.php` or `init` script).
- **Access Control**: Middleware-style checks at the top of every protected file (e.g., `require_role('admin')`).

## 4. Implementation Steps

1.  Create `sql/schema.sql` with the table definitions.
2.  Create `config/db.php` for robust database connection.
3.  Implement `includes/auth.php` for session management and role checking.
4.  Create `login.php` with validation and redirection logic.
5.  Implement the `admin` dashboard logic (CRUD for users/notices).
6.  Implement the notification system logic (trigger on notice creation).

## User Review Required
- Please confirm if the defined Roles (Admin, Teacher, Student, Employee) are sufficient.
- Confirm if "Hostinger shared hosting" implies standard Apache structure (usually `public_html`). We will deliver the code in a `php_backend` folder for you to upload.

