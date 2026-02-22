# 🎓 LDM College ERP System
## Complete Client Handbook — Standard Operating Procedures & Feature Reference

---

> **Document Type:** Client Delivery Handbook  
> **System:** LDM College Management ERP  
> **Website:** [ldmcollege.com](https://ldmcollege.com)  
> **Prepared by:** Development Team  
> **Version:** 1.0 — February 2026  

---

## Table of Contents

1. [What Is This System?](#1-what-is-this-system)
2. [Who Uses It & How?](#2-who-uses-it--how)
3. [How to Login](#3-how-to-login)
4. [Administrator Guide](#4-administrator-guide-step-by-step)
   - [Finance Management](#41-finance-management)
   - [Salary Management](#42-salary-management)
   - [Academic Setup](#43-academic-setup)
   - [User Management](#44-user-management)
   - [Attendance Overview](#45-attendance-overview)
   - [Examination & Results](#46-examination--results)
   - [Library Management](#47-library-management)
   - [Gallery Management](#48-gallery-management)
   - [Communication Tools](#49-communication-tools--notices--marquee)
   - [Course Pricing](#410-course-pricing-marketing)
5. [Teacher Guide](#5-teacher-guide)
6. [Student Guide](#6-student-guide)
7. [Full Feature List](#7-full-feature-list)
8. [Data Entry Best Practices](#8-data-entry--daily-operating-best-practices)
9. [System Architecture & Hosting](#9-system-architecture--hosting-overview)
10. [Security & Access Control](#10-security--access-control)
11. [Support & Handover](#11-support--handover)

---

## 1. What Is This System?

The **LDM College ERP (Enterprise Resource Planning)** is a fully custom-built, cloud-hosted digital management platform developed exclusively for LDM College. It replaces manual registers, spreadsheets, and disconnected tools with a **single, powerful web-based system** accessible from any device, anywhere.

### What problem does it solve?

| Before ERP | After ERP |
|---|---|
| Fee records maintained in registers or Excel | Automated, real-time fee tracking with payment history |
| Attendance marked on paper | Digital attendance with analytics per student, batch, and subject |
| No centralized notice system | Instant notices published to all students & public website simultaneously |
| Library books tracked manually | Full issue/return tracking with overdue monitoring |
| No online presence for course info | Public-facing course pages with pricing, discounts & countdowns |
| Exam results shared offline | Digital result cards, GPA calculation, semester transcripts |

---

## 2. Who Uses It & How?

The system is built around **four types of users**, each with their own controlled workspace:

```
┌────────────────────────────────────────────────────────────┐
│                    LDM College ERP                          │
├──────────────┬───────────────┬────────────┬────────────────┤
│  ADMIN       │  TEACHER      │  STUDENT   │  EMPLOYEE      │
│              │               │            │                │
│ Full control │ Attendance &  │ Fee view,  │ Assigned role- │
│ of all data  │ academic work │ attendance,│ based access   │
│              │               │ library    │                │
└──────────────┴───────────────┴────────────┴────────────────┘
```

### Role Summary

| Role | Key Responsibilities | Access Level |
|---|---|---|
| **Administrator** | Fees, salaries, exams, users, notices, gallery | Full system control |
| **Teacher / Faculty** | Mark attendance, view student data, library | Academic modules only |
| **Student** | View fees, attendance, results, notices | Read-only personal data |
| **Employee** | As assigned by Admin | Restricted |

---

## 3. How to Login

1. Open your browser and go to **[ldmcollege.com](https://ldmcollege.com)**
2. Click **"Login"** on the top navigation bar
3. Enter your **Email** and **Password**
4. The system will automatically take you to the correct dashboard based on your role

> **Admin Credentials:** Provided during system handover (keep these confidential)  
> **Teacher & Student Credentials:** Created by the Administrator from User Management

---

## 4. Administrator Guide (Step-by-Step)

The Administrator has full control over the entire system. Below are all major modules with clear, step-by-step instructions.

---

### 4.1 Finance Management

> **Purpose:** Track all money coming in (student fees) and going out (expenses) to monitor the college's financial health in real-time.

#### Step 1 — Set Up Fee Structures

A Fee Structure defines *how much* a student in a specific program and semester must pay.

1. Go to **Admin Sidebar → Finance → Fee Structures**
2. Click **"Add New Fee Structure"**
3. Fill in:
   - **Program** (e.g., DMLT, B.Sc Nursing)
   - **Academic Session** (e.g., 2024–2025)
   - **Semester** (e.g., Semester 1)
   - **Total Amount** (e.g., ₹45,000)
   - **Due Date** (the deadline for full payment)
4. Click **Save**

> ✅ Once saved, this fee structure is available when recording a student's payment.

---

#### Step 2 — Record a Student Payment

When a student pays their fees (in cash, online, or draft):

1. Go to **Finance → Fee Payments**
2. Click **"Record Payment"**
3. Select the **Student** from the dropdown
4. The system will auto-fill their applicable fee structure
5. Enter the **Amount Paid** and **Payment Date**
6. Select the **Payment Mode** (Cash / Bank Transfer / Cheque)
7. Add any **Remarks** if needed (e.g., "Partial payment, balance due")
8. Click **Save**

> ✅ The student can immediately see their payment reflected in the **"My Fees"** section.  
> ✅ The Finance Dashboard updates in real-time to show total collections.

---

#### Step 3 — Record an Expense

For any cost incurred by the college (electricity, supplies, maintenance, etc.):

1. Go to **Finance → Expenses**
2. Click **"Add Expense"**
3. Fill in:
   - **Title** (be specific — e.g., "Electricity Bill January 2025", not just "Bill")
   - **Amount**
   - **Date**
   - **Category** (Utilities, Maintenance, Stationery, etc.)
4. Click **Save**

---

#### Step 4 — Monitor Financial Health

The **Finance Dashboard** gives you a live snapshot:

| Dashboard Card | What It Shows |
|---|---|
| Total Revenue | All student fee payments collected |
| Total Expenses | All recorded college expenditures |
| **Net Balance** | Revenue minus Expenses — the college's financial position |
| Recent Transactions | Last 10 payments and expenses |

> 💡 **Recommended:** Check the Net Balance every morning as part of your daily routine.

---

### 4.2 Salary Management

> **Purpose:** Process and track monthly salaries for all teaching and non-teaching staff.

**What the system does automatically:**
- Maintains a record of every staff member's salary
- Tracks month-by-month payment history
- Prevents duplicate salary entries for the same month

**How to process a monthly salary:**

1. Go to **Admin Sidebar → Finance → Salary**
2. Select the **Employee / Teacher**
3. Confirm the **Month** and **Year**
4. Enter the **Amount** paid
5. Click **Mark as Paid**

---

### 4.3 Academic Setup

> **Purpose:** Define the building blocks of your academic year — programs, sessions, subjects, and batches.

This section must be set up **before** attendance, exams, or fees can work correctly.

#### Programs
Examples: DMLT, B.Sc Nursing, Pharmacy  
→ Go to **Academic → Programs → Add Program**

#### Sessions
Examples: 2024–2025, 2025–2026  
→ Go to **Academic → Sessions → Add Session**

#### Subjects
Attach subjects to programs and semesters  
→ Go to **Academic → Subjects → Add Subject**

#### Batches
Group students (e.g., DMLT 2024 Batch A) for structured attendance tracking  
→ Go to **Academic → Batches → Add Batch**

> ⚠️ **Important:** Always set the correct **Active Session** before the start of each academic year. Everything — fees, attendance, exams — is tied to the session.

---

### 4.4 User Management

> **Purpose:** Create login accounts for all teachers, students, and staff.

#### Creating a New User

1. Go to **Admin Sidebar → Users → User Management**
2. Click **"Add New User"**
3. Fill in:
   - **Full Name**
   - **Email** (this becomes their login username)
   - **Role** — choose carefully: `Admin`, `Teacher`, `Student`, or `Employee`
   - **Password** (they can change this after first login)
   - For Students: assign their **Program**, **Batch**, and **Session**
4. Click **Create User**

> ✅ The user can now log in immediately using their email and password.

#### Editing or Deactivating a User

- To **edit**, click the pencil icon next to any user
- To **delete/deactivate**, click the trash icon — this revokes their login access

---

### 4.5 Attendance Overview

> **Purpose:** Monitor attendance across all batches, subjects, and dates from the Admin level.

While teachers mark attendance (see Section 5), the Admin can:
- View attendance reports for any student, batch, or date range
- Identify students below the required attendance threshold
- Export attendance summaries

---

### 4.6 Examination & Results

> **Purpose:** Manage the full examination lifecycle from exam scheduling to final grade cards.

The system handles the complete academic result pipeline:

```
Exam Created → Marks Entered → Results Processed → Transcripts Generated
```

#### Step 1 — Create an Exam

1. Go to **Academic → Examinations → Create Exam**
2. Assign the **Program**, **Session**, **Semester**, and **Subjects**
3. Set the **Maximum Marks** per subject
4. Save the exam

#### Step 2 — Enter Student Marks

1. Go to the created exam and click **"Enter Marks"**
2. For each student, enter marks for each subject
3. Save marks

#### Step 3 — Process Results

1. Click **"Process Results"**
2. The system automatically:
   - Calculates **SGPA** (Semester Grade Point Average) using credit-hour weighting
   - Determines **Pass / Fail** status based on minimum marks
   - Logs academic progression for each student
3. Results are immediately visible to students in their dashboard

#### Understanding SGPA Calculation

> SGPA = Σ (Grade Points × Credit Hours) ÷ Total Credit Hours

Each subject has a defined credit. Higher-credit subjects weigh more in the final GPA — exactly as per university norms.

#### Step 4 — Transcripts

1. Once results are processed, go to **Results → View Transcript**
2. The system generates a **semester-wise transcript** per student
3. Transcripts are printable directly from the browser

---

### 4.7 Library Management

> **Purpose:** Maintain a full catalog of the college library and track which books are issued to which students.

#### Adding a New Book

1. Go to **Admin Sidebar → Library → Manage Books**
2. Click **"Add Book"**
3. Enter: Title, Author, ISBN, Category, Total Copies Available
4. Save

#### Issuing a Book to a Student

1. Go to **Library → Issue / Return**
2. Search for the **Student** and the **Book**
3. Set the **Due Return Date**
4. Click **Issue**

> ✅ The system will alert you if a book is overdue

#### Returning a Book

1. Go to **Library → Issue / Return**
2. Find the open issue record
3. Click **"Mark as Returned"**

#### Digital Library (Documents)

The system also supports a **digital document library** — PDF circulars, study material, and notes can be uploaded and made accessible to students online.

---

### 4.8 Gallery Management

> **Purpose:** Keep the college's public website gallery fresh and professional with real-time photo and video uploads.

1. Go to **Admin Sidebar → Gallery**
2. Click **"Upload New Media"**
3. Select a **Category**:
   - Activity
   - Awards
   - Classroom
   - Events
   - Campus Life
4. Upload your **Image** (JPG/PNG) or **Video** (MP4)
5. Click **Save**

> ✅ The photo/video goes live on the public website **immediately**  
> ✅ All media is stored on **Cloudinary** — a professional cloud hosting service that ensures fast loading speeds globally

---

### 4.9 Communication Tools — Notices & Marquee

#### Notices

Publish official announcements for students, faculty, and the public.

1. Go to **Admin → Notices → Create Notice**
2. Write the **Title** and **Content**
3. Set the **Publish Date** and optional **Expiry Date**
4. Click **Publish**

> ✅ Notices appear **instantly** on:
> - Student Dashboards (all logged-in students see it)
> - The Public College Website

#### Marquee (Running Ticker)

The scrolling ticker at the top of the college homepage. Use it for urgent, short announcements.

1. Go to **Admin → Marquee**
2. Click **"Add Message"**
3. Write the short message (e.g., "Admission Open for 2025–2026 Session")
4. Click **Save**

---

### 4.10 Course Pricing (Marketing)

> **Purpose:** Display course fees, special offers, and limited-time discounts on the public website to attract new admissions.

This is a **marketing module** that lets you create compelling course displays without touching the website code.

1. Go to **Admin → Course Pricing**
2. Click **"Add Pricing"**
3. Fill in:
   - **Course Name** (e.g., DMLT)
   - **Original Price** (e.g., ₹60,000)
   - **Offer Price** (e.g., ₹45,000)
   - **Offer Valid Until** (a date — the system shows a live countdown on the website)
   - **Seats Available** (optional — creates urgency)
4. Click **Save**

> ✅ The website will automatically display:
> - Strikethrough on the original price
> - Highlighted offer price with discount percentage
> - A live countdown timer until the offer expires

---

## 5. Teacher Guide

### Dashboard

Upon login, teachers see:
- Today's assigned subjects and batches
- Attendance statistics for the current month
- Latest college notices

### Marking Attendance

1. Go to **Attendance → Mark Attendance**
2. Select:
   - **Subject**
   - **Batch**
   - **Date** (defaults to today)
3. For each student in the list, select their status:
   - ✅ **Present**
   - ❌ **Absent**
   - 🕐 **Late**
   - 🔵 **Excused**
4. Click **Submit**

> ✅ Once submitted, attendance is locked for that day and batch  
> ✅ Students can see their own attendance immediately

### Library Access

Teachers can browse the full library catalog and request books.

### My Profile

Teachers can update:
- Contact information
- Professional bio/designation

---

## 6. Student Guide

### Dashboard

After login, students land on their personal dashboard showing:
- Today's notices
- Attendance summary (monthly)
- Upcoming fee dues

### My Fees

A complete record of all financial transactions:
- Total fees due for the semester
- Payments made (with date, amount, mode)
- Outstanding balance
- Due dates

> 💡 Students should check this section before visiting the accounts office to avoid confusion.

### My Attendance

- View month-wise attendance percentage
- See which dates were marked Absent or Late
- Subject-wise breakdown

> ⚠️ Students with attendance below the required threshold will see a warning here.

### Results & Transcripts

- View semester-wise results after the Admin processes them
- See SGPA, grade, and pass/fail status for each subject
- Print or download transcripts

### Library

- Browse the library book catalog
- View currently issued books and their return due dates
- Access digital documents uploaded by Admin

---

## 7. Full Feature List

### 🔐 Authentication & Security
- Email + Password login for all users
- Role-based access control (Admin / Teacher / Student / Employee)
- All passwords are securely hashed (industry standard bcrypt)
- Protected API routes — no data accessible without login
- Audit logs — every admin action is recorded with timestamp

---

### 👥 User Management
- Create, edit, and delete users of any role
- Assign students to programs, batches, and sessions
- Bulk operations supported

---

### 📚 Academic Management
- Define Programs, Sessions, Semesters, Subjects
- Configure credit hours per subject
- Manage academic batches

---

### 📋 Attendance System
- Teacher-driven daily attendance per subject and batch
- Status types: Present, Absent, Late, Excused
- Monthly analytics and percentage calculations
- Admin-level reporting across all batches

---

### 💰 Finance System
- Multi-structure fee management per program/semester
- Student payment recording with full history
- College expense tracking by category
- Real-time Net Balance dashboard
- Staff salary management with month-tracking

---

### 🎓 Examination & Results
- Exam creation with subject-wise marks
- Automated SGPA calculation (credit-hour weighted)
- Pass/Fail determination
- Student progression logging
- Semester transcripts generation

---

### 📖 Library System
- Book catalog management (add, edit, categorize)
- Issue and return tracking
- Overdue monitoring
- Digital document library (PDF study materials)

---

### 🌐 Public Website Integration
- Gallery with real-time media (photos & videos via Cloudinary)
- Public notices visible without login
- Course pricing pages with offer countdowns
- Marquee/ticker for urgent announcements

---

### 📢 Communication Tools
- Notice board (targeted to students + public)
- Marquee running ticker
- Digital circulars via library documents

---

### 🏗️ System Administration
- Audit log — complete trail of every admin action
- Academic session management
- Version control for key documents

---

## 8. Data Entry & Daily Operating Best Practices

Following these practices ensures your data stays clean, reliable, and useful:

### 1. Be Specific with Titles
❌ Bad: `"Bill"` or `"Payment"`  
✅ Good: `"Electricity Bill - January 2025"` or `"Semester 1 Fee - Rahul Sharma"`

### 2. Set Up Academic Config First
Every year, before the new session starts:
1. Create the new **Academic Session**
2. Set it as **Active**
3. Create Batches for new admissions
4. Set up Fee Structures for the new session

### 3. Daily Dashboard Check
Every morning, the Admin should:
- Check **Net Balance** on the Finance Dashboard
- Review any new **Notices** to be published
- Check pending **Library returns** (overdue books)

### 4. Keep the Website Fresh
- Upload new **Gallery** photos after every college event
- Update the **Marquee** with timely messages during admission season
- Update **Course Pricing** when running special admission offers

### 5. Student Data Accuracy
- Always assign the correct **Program, Batch, and Session** when creating a student account
- Incorrect assignments will cause their fee structure and attendance to appear incorrectly

---

## 9. System Architecture & Hosting Overview

> *This section is for reference. No action is required from the college administration.*

| Component | Technology | What It Means for You |
|---|---|---|
| **Frontend** | Next.js (React) | Fast, modern, works on all browsers and devices |
| **Backend** | Next.js API Routes | Secure server-side logic. No separate server needed. |
| **Database** | MongoDB (Atlas Cloud) | All your data stored securely on the cloud. Auto-backups. |
| **Media Storage** | Cloudinary | All gallery images and videos load fast worldwide |
| **Hosting** | Vercel | The website stays online 24/7 with global performance |
| **Security** | bcrypt + JWT | Passwords encrypted. Sessions secured. |

### Data Safety
- All data is stored in **MongoDB Atlas** — a globally distributed cloud database
- **Automatic backups** occur daily
- All communication between your browser and the system is **encrypted (HTTPS)**

---

## 10. Security & Access Control

The system enforces strict security at every level:

### What Each Role Can & Cannot Do

| Action | Admin | Teacher | Student | Employee |
|---|---|---|---|---|
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Fees | ✅ | ❌ | View Only | ❌ |
| Mark Attendance | ✅ | ✅ | ❌ | ❌ |
| View Own Attendance | ✅ | ✅ | ✅ | ✅ |
| Publish Notices | ✅ | ❌ | ❌ | ❌ |
| View Notices | ✅ | ✅ | ✅ | ✅ |
| Process Results | ✅ | ❌ | ❌ | ❌ |
| View Own Results | ✅ | ✅ | ✅ | ✅ |
| Manage Gallery | ✅ | ❌ | ❌ | ❌ |
| Manage Library | ✅ | ❌ | ❌ | ❌ |
| Manage Salaries | ✅ | ❌ | ❌ | ❌ |

### Audit Trail
Every action performed by an Admin is logged with:
- The **action performed** (e.g., "User Created", "Payment Recorded")
- The **timestamp**
- The **IP address** of the device used

This ensures full accountability and helps in case of any disputes or review needs.

---

## 11. Support & Handover

### First Steps After Handover

1. ✅ **Change the Admin password** immediately after first login
2. ✅ Set up the **Active Academic Session** for the current year
3. ✅ Create **teacher and student accounts** as needed
4. ✅ Add **Fee Structures** for each program and semester
5. ✅ Upload initial **Gallery photos** and publish the first **Notice**

### Who to Contact for Support

For any issues, bugs, or feature requests, please reach out to the development team at the contact provided during handover.

### What Is Included in the Handover

- ✅ Full source code (version controlled on GitHub)
- ✅ Admin login credentials
- ✅ MongoDB database connection details
- ✅ Cloudinary media storage credentials
- ✅ Vercel deployment access
- ✅ This documentation

---

*© 2026 LDM College ERP System — Developed & Delivered by the Development Team*  
*This document is confidential and intended for LDM College administration use only.*
