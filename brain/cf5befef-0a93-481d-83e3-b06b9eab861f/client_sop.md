# LDM College ERP — Standard Operating Procedures (SOP)
**System**: LDM College of Pharmacy ERP  
**Version**: 1.0  
**Date**: February 2026  
**Users**: ~70 (Admin, Teachers, Students, Employees)

---

## Table of Contents
1. [System Login & Portal Access](#1-system-login--portal-access)
2. [Admin Portal](#2-admin-portal)
3. [Teacher Portal](#3-teacher-portal)
4. [Student Portal](#4-student-portal)
5. [Public Website](#5-public-website)
6. [E-Library (All Users)](#6-e-library--all-users)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. System Login & Portal Access

### Login URL
- **Public Website**: `https://ldmcollege.vercel.app`
- **Sign In Page**: `https://ldmcollege.vercel.app/auth/signin`

### Portal Routing (automatic redirect after login)
| Role | Redirected To |
|---|---|
| Admin | `/admin` |
| Teacher | `/teacher` |
| Student | `/student` |
| Employee | `/employee` |

### Login Steps
1. Go to the Sign In page.
2. Enter **Username** and **Password**.
3. Click **Sign In** → you will be redirected to your portal automatically.
4. If you see "Access Denied", your role may not match the URL. Log out and sign in again.

> [!NOTE]
> Passwords are set by the Admin during user creation. Students use their enrollment number as the default username.

---

## 2. Admin Portal

**Access**: `/admin` (Admin role only)

### 2.1 Admin Dashboard
- Shows live stats: **Total Users, Students, Teachers, Active Notices, Unread Messages**.
- All counts are real-time from the database.

---

### 2.2 User Management (`/admin/users`)

#### Creating a New User
1. Click **+ Add User**.
2. Fill in: Full Name, Username, Email, Password, Role (admin/teacher/student/employee).
3. For **Students**: assign a Session and Batch.
4. Click **Create User**.
5. ✅ The student is automatically counted in the Batch's student count.

#### Editing a User
1. Find the user in the table.
2. Click the **Edit** (pencil) icon.
3. Update fields → Click **Save**.

#### Deleting a User
1. Click the **Delete** (trash) icon next to a user.
2. Confirm the action.
3. ✅ If the user is a student, their batch student count is automatically decremented.

> [!IMPORTANT]
> You cannot delete your own admin account. Always maintain at least 1 active admin.

---

### 2.3 Academic Setup (`/admin/academic`)

The academic setup follows a strict hierarchy: **Program → Session → Batch → Subjects → Assignments**.

#### Programs
- Programs represent degree/diploma courses (e.g., DCCM, BPMT).
- Click **Programs** tab → **+ Add Program**.
- Fill: Name, Code, Duration (years), Type (diploma/degree).

#### Sessions
- Represents the academic year (e.g., "2024-2025").
- Click **Sessions** tab → **+ Add Session**.
- Link to a Program.

#### Batches
- A Batch is a specific intake group within a session.
- Click **Batches** tab → **+ Add Batch**.
- Set: Name, Program, Session, Max Students, Current Semester.
- **Promote Semester**: Click the "Promote" button on a Batch to move all its students to the next semester (e.g., Sem 1 → Sem 2).

#### Subjects
- Subjects belong to a Session.
- Click **Subjects** tab → **+ Add Subject**.

#### Teacher Assignments
- Assigns a teacher to a subject for a specific batch.
- Go to **Assignments** tab → **+ Assign Teacher**.

---

### 2.4 Attendance Management (`/admin/attendance`)
- Admin can view attendance records across all batches.
- Attendance is entered by Teachers (see Section 3.2).
- Filter by Batch and Date to view records.

---

### 2.5 Finance Module

#### Fee Structures (`/admin/finance/fee-structures`)
1. Click **+ Add Fee Structure**.
2. Fill: Program, Session, Semester, Total Amount, Due Date, Description.
3. Fee structures define what students owe per semester.

#### Fee Payments (`/admin/finance/payments`)
- View all student fee payments.
- Filter by **Status** (unpaid/partial/paid) or **Session**.
- Click a student row to record a new payment installment.
- Each payment logs: amount, date, and reference number.
- Status updates automatically: partial (if amount < total) → paid (when full amount received).

> [!IMPORTANT]
> Payments cannot be deleted. To reverse a payment, contact the system administrator.

#### Finance Dashboard (`/admin/finance`)
- Shows: **Total Revenue, Total Expenses, Total Salary Paid, Net Balance, Pending Fees**.
- Chart shows last 6 months of revenue vs. expenses.
- Bottom table lists the **Top 5 Pending Payments** for quick follow-up.

#### Expenses (`/admin/finance/expenses`)
1. Click **+ Add Expense**.
2. Fill: Category, Amount, Description, Date Paid.
3. Expenses are included in the Finance Dashboard total spend.

#### Salary Management (`/admin/finance/salary`)
1. Click **+ Add Salary Record**.
2. Fill: Employee, Month/Year, Basic Salary, Allowances/Deductions.
3. Net amount is auto-calculated.
4. Mark as **Paid** when disbursed — this updates the Dashboard.

#### Audit Logs (`/admin/finance`)
- Every financial action is logged with: action type, entity, performed by, IP address, timestamp.
- Logs are read-only and cannot be deleted.

---

### 2.6 Library Management (`/admin/library`)

#### Adding a Document
1. Go to **Library → Documents**.
2. Click **+ Upload Document**.
3. Fill: Title, Category, Program (or check "Common — all programs").
4. Choose type: **Markdown (MD)** for academic notes, **PDF** for scanned docs, **Rich Text** for formatted content.
5. Paste content (for MD/Rich Text) or enter file URL (for PDF/uploaded files).
6. Click **Upload** → A Version 1 is automatically created.

#### Editing a Document
1. Click **Edit** on a document row.
2. Modify content or metadata → **Save**.
3. A new version is created automatically for every edit. Previous versions are preserved.

#### Version History
- Click the **History** icon on a document to see all versions.
- Each version shows: version number, date, and who updated it.

#### Categories
- Go to **Library → Categories** to add/edit document categories (e.g., "Module Notes", "Foundation Modules").

#### Deleting a Document
- Documents are **soft-deleted** (not permanently removed). They are hidden from all views but remain in the database for audit purposes.

---

### 2.7 Gallery Management (`/admin/gallery`)
1. Click **+ Add Media**.
2. Upload an image or video file.
3. Set Title and Category.
4. The item immediately appears on the public gallery page.
5. To delete: click the **Delete** button on the item card.

---

### 2.8 Notices & Announcements (`/admin/notices`)
1. Click **+ Add Notice**.
2. Write the notice message. Toggle **Active** to make it visible.
3. Active notices appear on:
   - The public notices page.
   - The student dashboard.
4. To deactivate a notice, click **Edit → uncheck Active → Save**.

---

### 2.9 Marquee Messages (`/admin/marquee`)
- The scrolling ticker on the public homepage.
1. Click **+ Add Message**.
2. Enter the message text and toggle **Active**.
3. Multiple active messages are shown in a scrolling marquee.

---

### 2.10 Enquiry Messages (`/admin/messages`)
- View all contact form submissions from website visitors.
- Each message shows: Name, Email, Phone, Subject, Message, Date.
- Click a message to mark it as **Read**.

---

## 3. Teacher Portal

**Access**: `/teacher` (Teacher role only)

### 3.1 Teacher Dashboard
- Shows a summary of assigned subjects and classes.
- Live timetable of assignments.

---

### 3.2 Attendance Entry (`/teacher/attendance`)

**Process**:
1. Select the **Assignment** (subject + batch).
2. Select the **Date** of the class.
3. For each student in the list, select: **Present / Absent / Late**.
4. Click **Submit Attendance**.
5. ✅ Records are saved immediately and visible on the student dashboard.

> [!NOTE]
> Attendance can be entered retroactively by selecting a past date. Duplicate entries for the same student/assignment/date are automatically handled (upserted).

---

### 3.3 Marks Entry (`/teacher/marks`)

**Process**:
1. Select the **Assignment** (subject + batch).
2. Select **Exam Type**: Midterm, Final, or Practical.
3. Enter the **Maximum Marks** for the exam.
4. Fill in **marks obtained** for each student (leave blank for absent students).
5. Add optional **Remarks** per student.
6. Click **Save Marks**.
7. ✅ Marks are immediately visible on the student's Report Card.

---

## 4. Student Portal

**Access**: `/student` (Student role only)

### 4.1 Student Dashboard
- **Attendance Summary**: Shows %, present count, absent count, late count.
  - 🟢 Green: ≥90%
  - 🟡 Yellow: 75–89%
  - 🔴 Red: <75% (with a warning notice)
- **Recent Notices**: Latest college announcements.

---

### 4.2 Fee Payment View (`/student/fees`)
- Shows all fee structures assigned to the student.
- Displays: Semester, Total Amount, Amount Paid, Balance, Status (Unpaid / Partial / Paid).
- Payment history shows all installments made.
- **Action**: Students can view status but cannot record payments (only Admin can).

---

### 4.3 Report Card (`/student/report-card`)
- Shows marks grouped by semester.
- Each entry shows: Subject, Teacher, Exam Type, Max Marks, Marks Obtained, Remarks.
- Results are sorted with the most recent semester first.

---

## 5. Public Website

**Access**: Anyone (no login required)

### 5.1 Homepage (`/`)
- Hero image slider with college highlights.
- Animated statistics (Students, Placement Rate, Years).
- Welcome section with campus overview.
- Floating phone button for direct call to admissions.

### 5.2 Courses (`/courses`)
- Displays all available diploma and degree programs.

### 5.3 Gallery (`/gallery`)
- Shows all active photos and videos uploaded by Admin.
- Organized by category.

### 5.4 Notices (`/notices`)
- Public notice board showing all active college announcements.

### 5.5 Contact (`/contact`)
- Enquiry form: Name, Email, Phone, Subject, Message.
- Submitted messages go to the **Admin Messages panel**.

### 5.6 Other Pages
- `/about` — College background and mission.
- `/team` — Faculty and staff profiles.
- `/facilities` — Campus facilities overview.
- `/collaborations` — Partner institutions.
- `/hospital` — Hospital lab integration details.

---

## 6. E-Library (All Users)

### 6.1 Public Library (`/library`)

**Who can access**: Everyone (no login needed).

**How to find a document**:
1. Use the **search bar** to type the document title.
2. Use the **Program filter** on the left to narrow by program (e.g., DCCM, BPMT).
3. Use the **Category filter** to filter by type (e.g., Module Notes, Foundation).
4. Documents are displayed as cards or list rows.

**How to read a document**:
1. Click **Open Book** on a document card.
2. The document opens in the **Premium Reader**.
3. For Markdown/academic notes, the **Table of Contents** appears on the left — click any heading to jump directly to that section.
4. Use **A-/A+** buttons in the header to adjust font size.
5. Click **☰** (hamburger icon, bottom-left) to toggle the TOC sidebar.

**How to Save as PDF**:
1. Click **Save as PDF** in the reader header.
2. A new browser window opens with a clean, professionally formatted version of the document.
3. Your browser's print dialog opens automatically.
4. Select **"Save as PDF"** as the destination.
5. Click **Save** → choose a file location → Done.

### 6.2 Student Library (`/student/library`)
- Same as the public library, but requires student login.
- Your program is auto-detected, so your program's documents are highlighted.

---

## 7. Troubleshooting

| Issue | Solution |
|---|---|
| "Access Denied" on a page | Log out and sign in again. Verify your role with the admin. |
| Student not showing up in Attendance/Marks | Ensure the student is assigned to the correct Batch. |
| Library document shows as raw text | The document may need to be saved as Markdown (.md) format. |
| Finance Dashboard shows ₹0 | No payments have been recorded yet. Add fee structures and record a payment. |
| "Save as PDF" window doesn't open | Check browser pop-up blocker — allow pop-ups for this site. |
| Marks not showing on Report Card | Ensure the teacher has saved marks for that subject and exam type. |
| Attendance % not updating | Check if attendance was submitted with the correct Date and Assignment. |
| Gallery images not appearing | Ensure the media item is marked "Active" in the Admin Gallery panel. |

---

## Quick Reference: Role Access Matrix

| Feature | Admin | Teacher | Student | Employee | Public |
|---|:---:|:---:|:---:|:---:|:---:|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Academic Setup | ✅ | ❌ | ❌ | ❌ | ❌ |
| Attendance (Enter) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Attendance (View) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marks Entry | ❌ | ✅ | ❌ | ❌ | ❌ |
| Report Card | ✅ | ✅ | ✅ | ❌ | ❌ |
| Finance (Full) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Fee Status (View) | ✅ | ❌ | ✅ | ❌ | ❌ |
| Library | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gallery | ✅ (CRUD) | ❌ | ❌ | ❌ | 👁️ |
| Notices (Edit) | ✅ | ❌ | ❌ | ❌ | 👁️ |
| Enquiries | ✅ | ❌ | ❌ | ❌ | 📝 |

---

*Document prepared by the development team. For technical support, contact the system administrator.*
