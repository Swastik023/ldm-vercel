# LDM 2.0 — Backend Feature List

> **Stack:** Next.js 15 (App Router) · MongoDB (Mongoose) · NextAuth.js · Cloudinary · bcryptjs

---

## 🔐 Authentication & Authorization

| Feature | Status | Details |
|---|---|---|
| Credential-based login | ✅ Done | Email + password via NextAuth |
| JWT session (id, role, username) | ✅ Done | Token maps to session |
| Role-based access control | ✅ Done | `admin`, `teacher`, `student` |
| Password hashing | ✅ Done | bcryptjs (10 rounds) |
| Protected API routes | ✅ Done | `getServerSession` checks on every route |
| Sign out | ✅ Done | NextAuth signOut |

---

## 👤 User Management (`/api/admin/users`)

| Feature | Status | Details |
|---|---|---|
| List all users | ✅ Done | `GET` — populated session + batch |
| Create user | ✅ Done | `POST` — supports student session/batch assignment |
| Delete user | ✅ Done | `DELETE ?id=` — decrements batch count for students |
| Batch counter sync | ✅ Done | `+1` on create, `-1` on delete |
| Student batch + session assignment | ✅ Done | Stored as ObjectId refs on User |

### ❌ Missing / To Do
- Edit/update user details (PATCH)
- Change password (admin-side)
- Bulk import students (CSV upload)
- User profile photo upload
- Student roll number / ID field

---

## 🎓 Academic Management (`/actions/academic`)

### Programs
| Feature | Status |
|---|---|
| Create program | ✅ Done |
| List all programs | ✅ Done |
| Delete program | ✅ Done |

### Sessions
| Feature | Status |
|---|---|
| Create session (`is_active: true` by default) | ✅ Done |
| List all sessions | ✅ Done |
| Delete session | ✅ Done |

### Subjects
| Feature | Status |
|---|---|
| Create subject (name, code, credits, type, semester) | ✅ Done |
| List subjects (with program filter) | ✅ Done |
| Delete subject | ✅ Done |

### Batches (`/admin/batches`)
| Feature | Status |
|---|---|
| Create batch (linked to program + session) | ✅ Done |
| List batches | ✅ Done |
| Delete batch | ✅ Done |
| `current_students` counter | ✅ Done |

### Subject Assignments (`/admin/academic/assignments`)
| Feature | Status |
|---|---|
| Assign subject to teacher + batch + section | ✅ Done |
| List assignments (with filters) | ✅ Done |
| Update assignment | ✅ Done |
| Delete assignment | ✅ Done |

### ❌ Missing / To Do
- Edit program / session / subject (PUT/PATCH)
- Semester / exam timetable management
- Curriculum mapping (subjects per semester per program)
- Bulk subject upload

---

## 📋 Attendance (`/api/teacher/attendance/[assignmentId]`)

| Feature | Status | Details |
|---|---|---|
| Fetch students for an assignment | ✅ Done | `GET` — filters students by batch from Assignment |
| Save attendance records | ✅ Done | `POST` — upserts by date + subject + section |
| Statuses: Present, Absent, Late, Excused | ✅ Done | Stored per student record |
| Remarks per student | ✅ Done | |
| Mark-all Present / Absent | ✅ Done | Client-side only |
| Student attendance stats (student dashboard) | ✅ Done | Calculates % from Attendance model |
| Teacher today's stats (teacher dashboard) | ✅ Done | Counts marked records for today |

### ❌ Missing / To Do
- View past attendance records (by date range)
- Edit/correct submitted attendance
- Attendance report export (PDF/CSV)
- Attendance locking (prevent edits after 24h)
- Automated low-attendance alerts

---

## 📊 Dashboards

### Admin (`/api/admin/stats`)
| Feature | Status |
|---|---|
| Count of users, programs, sessions | ✅ Done |

### Student (`/api/student/dashboard`)
| Feature | Status |
|---|---|
| Profile with session + batch | ✅ Done |
| Attendance: present / absent / late counts + % | ✅ Done |
| Active notices list | ✅ Done |

### Teacher (`/api/teacher/dashboard`)
| Feature | Status |
|---|---|
| Assigned subjects count | ✅ Done |
| Courses list (subject, batch, section) | ✅ Done |
| Today's attendance stats | ✅ Done |
| Active notices list | ✅ Done |

### ❌ Missing / To Do
- Student: upcoming exam schedule
- Teacher: per-student attendance summary
- Admin: revenue / fee tracking
- Admin: charts and analytics

---

## 📚 Library (`/api/student/library`)

| Feature | Status | Details |
|---|---|---|
| List all library documents | ✅ Done | `GET` — returns all Library model records |
| Category filtering | ✅ Done | Client-side |
| Download (direct URL) | ✅ Done | Links to Cloudinary URL |

### ❌ Missing / To Do
- Admin upload document (`POST /api/admin/library`)
- Delete document (admin)
- Per-batch / per-program document visibility
- Search by title

---

## 📝 Notices (`/api/public/notices`)

| Feature | Status |
|---|---|
| Create notice (admin) | ✅ Done |
| List active notices (public) | ✅ Done |
| Priority levels (low / medium / high / urgent) | ✅ Done |
| Category filtering | ✅ Done |
| isActive toggle | ✅ Done |

### ❌ Missing / To Do
- Edit notice
- Delete notice
- Scheduled publish / expiry dates
- Targeted notices (per role / batch)

---

## 🖼️ Gallery (`/api/public/gallery`)

| Feature | Status |
|---|---|
| Upload image (Cloudinary) | ✅ Done |
| List active gallery images (public) | ✅ Done |
| Toggle image active/inactive | ✅ Done |

### ❌ Missing / To Do
- Delete image (admin)
- Album / category grouping
- Alt text / caption editing

---

## 📢 Marquee / Scrolling Updates

| Feature | Status |
|---|---|
| Create message | ✅ Done |
| List active messages (public) | ✅ Done |
| Toggle active/inactive | ✅ Done |
| CRUD (admin panel) | ✅ Done |

---

## 🗂️ Data Models (MongoDB / Mongoose)

| Model | Collection | Purpose |
|---|---|---|
| `User` | `users` | Students, teachers, admins |
| `Program` | `programs` | Degree programs |
| `Session` | `sessions` | Academic years |
| `Subject` | `subjects` | Course subjects |
| `Batch` | `batches` | Student batches per program/session |
| `Assignment` | `assignments` | Teacher→Subject→Batch→Section mapping |
| `Attendance` | `attendances` | Daily per-subject attendance records |
| `Notice` | `notices` | Announcements |
| `Library` | `libraries` | Study material documents |
| `Gallery` | `galleries` | Institution image gallery |
| `MarqueeMessage` | `marqueemessages` | Scrolling announcements |
| `Contact` | `contacts` | Public contact form submissions |

---

## 🚧 Major Missing Backend Features (Priority Order)

| Priority | Feature | Notes |
|---|---|---|
| 🔴 High | **Results / Report Card model + API** | `Result` model: student, subject, exam, marks, grade. API: `GET /api/student/report-card`, `POST /api/admin/results` |
| 🔴 High | **Fee Management** | Fee structure, student fee records, payment status |
| 🔴 High | **Edit user (PATCH)** | Update name, email, batch, session for existing users |
| 🟠 Medium | **Admin library upload** | `POST /api/admin/library` with Cloudinary upload |
| 🟠 Medium | **Exam / Timetable** | Exam schedule per batch/semester |
| 🟠 Medium | **Attendance history view** | Teacher views past attendance by date range |
| 🟡 Low | **Contact form handler** | Save submissions, admin view |
| 🟡 Low | **Notification system** | Push or in-app notifications |
| 🟡 Low | **CSV import for bulk students** | Admin uploads roster |
