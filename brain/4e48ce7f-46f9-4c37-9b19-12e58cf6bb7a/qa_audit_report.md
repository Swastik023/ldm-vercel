# System QA Audit Report
**Date:** 2026-03-01 | **Auditor:** System Analyst | **Scope:** All roles, all flows

---

## Section 1: Critical Flow Breaks

---

### [ISSUE-001]
**Role:** Student  
**Dashboard / Page:** `/student/fees`  
**Flow Type:** Data Flow  
**What Exists:** Student fee page displays fields: `course`, `baseCoursePrice`, `discountPercent`, `finalFees`, `amountPaid`, `remainingAmount`, `payments[].method`  
**What Is Missing / Broken:** The API (`/api/student/fees`) now returns `StudentFee` model fields: `courseId`, `baseFee`, `discountPct`, `finalFee`, `amountPaid`, `payments[].note` — **none of these field names match what the frontend expects**. The student fee page will silently render `₹0`, `₹0`, `₹0` for all amounts and "No payments recorded yet" even if real data exists.  
**Impact:** Students cannot view their fee details. Page shows blank data even when fees are assigned.  
**Severity:** Critical  
**Blocking Further Flow:** Yes  
**Notes:** The page was written against the old `FeeRecord` model schema and was never updated when the data source was switched to `StudentFee`.

---

### [ISSUE-002]
**Role:** Student  
**Dashboard / Page:** `/student/fees`  
**Flow Type:** Data Flow  
**What Exists:** Page displays `d.record` (single record)  
**What Is Missing / Broken:** API now returns `fees[]` (array of all fee records) and `record` (first record only). Student with multiple fee records (multiple academic years, multiple courses) will only see the first one. No way to switch between fee records.  
**Impact:** Students with more than one fee record see incomplete data.  
**Severity:** High  
**Blocking Further Flow:** No  

---

### [ISSUE-003]
**Role:** Teacher  
**Dashboard / Page:** `/teacher/marks`  
**Flow Type:** Logic Flow  
**What Exists:** Teacher can enter marks for any exam type (midterm, final, practical, assignment) and save  
**What Is Missing / Broken:** There is **no guard preventing marks from being re-saved**. If a teacher clicks "Save Marks" twice for the same subject + exam_type, marks are overwritten silently. No confirmation dialog. No "already saved" indicator. No lock after submission.  
**Impact:** Accidental double-saves overwrite previously correct marks.  
**Severity:** High  
**Blocking Further Flow:** No  

---

### [ISSUE-004]
**Role:** Teacher  
**Dashboard / Page:** `/teacher/attendance/[classId]`  
**Flow Type:** Logic Flow  
**What Exists:** Teacher marks attendance. `Attendance` schema has a unique index on `{ date, subject, section }`.  
**What Is Missing / Broken:** If the teacher tries to mark attendance for a class that **already has an attendance record for today**, the API will throw a MongoDB duplicate key error. This is caught by a generic error handler and the teacher sees a raw error message — no friendly "Attendance already marked today" message and no "Edit existing" option.  
**Impact:** Teacher has no way to correct a mistake made earlier the same day.  
**Severity:** High  
**Blocking Further Flow:** Yes (can't correct attendance)  

---

### [ISSUE-005]
**Role:** Admin  
**Dashboard / Page:** `/admin/users` (User Management)  
**Flow Type:** Data Flow  
**What Exists:** Admin creates a user via `POST /api/admin/users`. The inline comment on line 65 still reads: *"Auto-create default fee record from CoursePricing"*  
**What Is Missing / Broken:** Code was updated to use `Program.pricing` via `autoCreateStudentFee`, but the comment is wrong. More critically, `isProfileComplete` is **never set** when creating a user via the admin user form — it defaults to `undefined/false`. This means any admin-created student user is immediately redirected to `/complete-profile` on first login, confusing them.  
**Impact:** Admin-created students always see the "complete profile" screen on first login before reaching their dashboard.  
**Severity:** High  
**Blocking Further Flow:** Yes (blocks first login flow)  

---

## Section 2: Missing UI or API Coverage

---

### [ISSUE-006]
**Role:** Teacher  
**Dashboard / Page:** Tests  
**Flow Type:** User Flow  
**What Exists:** `GET /api/admin/tests` allows role `admin OR teacher`. Tests can be created by teachers.  
**What Is Missing / Broken:** There is **no `/teacher/tests` page, no link from teacher dashboard, and no teacher UI to create, view, or manage tests**. The API allows it but the teacher has no interface.  
**Impact:** If a teacher is expected to create or manage tests, this feature is entirely inaccessible to them.  
**Severity:** High  
**Blocking Further Flow:** Yes (feature is unreachable)  

---

### [ISSUE-007]
**Role:** Admin  
**Dashboard / Page:** Exam / Report Cards  
**Flow Type:** User Flow  
**What Exists:** Students have a `/student/report-card` page. Marks are entered by teachers.  
**What Is Missing / Broken:** Admin has **no report card view, no result processing page, and no overall exam overview**. Admin cannot preview what a student sees before it's published, cannot lock results, cannot generate bulk reports.  
**Impact:** Admin has no control or visibility into the exam → report card pipeline once marks are entered by a teacher.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

### [ISSUE-008]
**Role:** Teacher  
**Dashboard / Page:** Library  
**Flow Type:** User Flow  
**What Exists:** Admin can upload library documents. Students can browse the library.  
**What Is Missing / Broken:** Teachers have **no library page and no library upload capability**. Teachers are typically responsible for study materials.  
**Impact:** Teachers cannot share study materials through the system.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

### [ISSUE-009]
**Role:** Student  
**Dashboard / Page:** Test Result `/student/tests/[id]/result`  
**Flow Type:** Navigation Flow  
**What Exists:** Student can view test result after completion  
**What Is Missing / Broken:** There is **no "Back to Tests" or "Return to Dashboard" navigation on the result page**. Student is stranded on the result page with no UI-provided exit path (must use browser back button).  
**Impact:** Dead-end navigation — poor UX, especially on mobile.  
**Severity:** Medium  
**Blocking Further Flow:** Yes (navigation dead end)  

---

### [ISSUE-010]
**Role:** Admin  
**Dashboard / Page:** Student profile panel  
**Flow Type:** Data Flow  
**What Exists:** Admin student panel shows `aadhaarIdUrl` (legacy) in `STANDARD_DOC_SLOTS` alongside the newer `aadhaarFrontUrl` + `aadhaarBackUrl` fields  
**What Is Missing / Broken:** Admin UI shows **three Aadhaar-related slots** (Legacy + Front + Back). A student may have uploaded to the legacy slot while the admin reviews the new slots — both show to admin creating confusion about which document is the real one.  
**Impact:** Admin may approve/reject the wrong document. Inconsistent document representation.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

### [ISSUE-011]
**Role:** Admin  
**Dashboard / Page:** `/admin/notices`  
**Flow Type:** User Flow  
**What Exists:** Admin creates notices with `startDate` and `endDate` fields  
**What Is Missing / Broken:** The **public notices page** does not filter by `startDate` — a notice with a future `startDate` will appear immediately on the public page. Also, there is no admin UI to preview how a notice will look to a public visitor or student before publishing.  
**Impact:** Notices appear before their intended publish date. No draft/preview state.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

## Section 3: Navigation & Dead Ends

---

### [ISSUE-012]
**Role:** All  
**Dashboard / Page:** Teacher dashboard  
**Flow Type:** Navigation Flow  
**What Exists:** Teacher dashboard shows "My Assigned Courses" with each course linking to `/teacher/attendance/[classId]`  
**What Is Missing / Broken:** Clicking a course from the dashboard goes **directly to marking attendance** for that course. There is no course detail page, no option to view past attendance records for a course, and no marks history from this link. Teacher is forced into "take attendance" mode with no other option from this card.  
**Impact:** Teacher cannot view historical attendance or marks without going through separate pages.  
**Severity:** Low  
**Blocking Further Flow:** No  

---

### [ISSUE-013]
**Role:** Student  
**Dashboard / Page:** `/student/jobs`  
**Flow Type:** Navigation Flow  
**What Exists:** Student can apply for jobs and refer others  
**What Is Missing / Broken:** After applying, student is shown a toast but **no list of "My Applications" is shown anywhere**. Student cannot check the status of their job applications — whether shortlisted, rejected, accepted.  
**Impact:** Students cannot track application status after submitting.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

### [ISSUE-014]
**Role:** Public  
**Dashboard / Page:** `/register`  
**Flow Type:** Navigation Flow  
**What Exists:** Public registration form exists  
**What Is Missing / Broken:** After submitting registration, there is **no confirmation page or "check your status" link**. The user is redirected to `/pending-approval` but that page gives no instructions for what happens next or how long to expect.  
**Impact:** Applicants don't know next steps after registering.  
**Severity:** Low  
**Blocking Further Flow:** No  

---

### [ISSUE-015]
**Role:** Admin  
**Dashboard / Page:** Two admin route groups  
**Flow Type:** Navigation Flow  
**What Exists:** Admin pages are split across `app/(admin)/admin/*` (has layout) and `app/admin/*` (flat, no route group)  
**What Is Missing / Broken:** Pages in `app/admin/*` (finance, attendance, library, academic, etc.) **may be using a different layout or no admin layout at all**. A student who navigates directly to `/admin/finance` may not be properly caught by the admin layout's sidebar/header.  
**Impact:** Inconsistent admin UI chrome across different admin pages. Potential layout breaks.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

## Section 4: Data & Logic Inconsistencies

---

### [ISSUE-016]
**Role:** All  
**Dashboard / Page:** Finance Dashboard  
**Flow Type:** Data Flow  
**What Exists:** Finance dashboard aggregates both `StudentFee` and `FeePayment` collections and reports totals from each  
**What Is Missing / Broken:** The dashboard shows **two separate "collected" figures** from two different systems, labeled differently. Admins could interpret these as the same money counted twice. No clear labeling distinguishes "ERP-style fees" from "simple fee management fees."  
**Impact:** Admin may misread total revenue as doubled, or miss that there are two separate fee systems running in parallel.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

### [ISSUE-017]
**Role:** Admin  
**Dashboard / Page:** `/admin/fees` — bulk fee assignment  
**Flow Type:** Logic Flow  
**What Exists:** `POST /api/admin/fees/course` creates StudentFee records for all active students  
**What Is Missing / Broken:** The endpoint queries `User.find({ role: 'student', status: 'active' })` to get students. **No batch/program filter is applied by default** — if `batchId` is not passed, fees are created for ALL active students across ALL programs regardless of their course. Admin can accidentally assign a `DCCM` course fee to all `MBA` students.  
**Impact:** Mass incorrect fee assignment if admin forgets to specify a batch.  
**Severity:** High  
**Blocking Further Flow:** No  

---

### [ISSUE-018]
**Role:** Teacher  
**Dashboard / Page:** Marks Entry  
**Flow Type:** Logic Flow  
**What Exists:** Teacher enters marks with a `maxMarks` input field, defaults to 100  
**What Is Missing / Broken:** There is **no frontend validation** preventing a teacher from entering `marks_obtained > maxMarks`. A student could receive 150/100. The `maxMarks` field itself has no min validation — could be set to 0.  
**Impact:** Invalid marks silently saved to the database, breaking GPA calculations.  
**Severity:** High  
**Blocking Further Flow:** No  

---

### [ISSUE-019]
**Role:** Student  
**Dashboard / Page:** `/student/documents`  
**Flow Type:** Logic Flow  
**What Exists:** Upload button is hidden when `isOverdue: true`  
**What Is Missing / Broken:** An overdue mandatory document cannot be submitted. The student sees "Overdue" but has **no way to request an extension or contact admin from this page**. The document is permanently locked for submission once overdue.  
**Impact:** Students with mandatory overdue documents are permanently blocked from submitting. No escape hatch.  
**Severity:** Medium  
**Blocking Further Flow:** Yes (for mandatory overdue documents)  

---

### [ISSUE-020]
**Role:** Admin  
**Dashboard / Page:** User approval flow  
**Flow Type:** Logic Flow  
**What Exists:** Admin can approve or reject a student. On reject, admin provides per-document rejection reasons.  
**What Is Missing / Broken:** When admin **approves** a student, there is no check that the student has actually uploaded required documents (passport photo, marksheets, Aadhaar). Admin can approve an entirely blank student profile.  
**Impact:** Students can be approved and become active without having any documents on file.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

## Section 5: Role-Specific Gaps

---

### [ISSUE-021]
**Role:** Public  
**Dashboard / Page:** Public Library `/library`  
**Flow Type:** Data Flow  
**What Exists:** Public library page reads from `Library` model (old). `LibraryDocument` model (new, with versioning, categories, subjects) is used in the admin panel.  
**What Is Missing / Broken:** Documents uploaded via `admin/library/documents` (the new system) **never appear on the public library page** — they only appear in the student library (`/student/library`). Public visitors see only old content.  
**Impact:** Public library is stale and disconnected from the active content management system.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

### [ISSUE-022]
**Role:** Teacher  
**Dashboard / Page:** Teacher dashboard  
**Flow Type:** User Flow  
**What Exists:** Teacher sees "Recent Notices" sourced from the Notice model  
**What Is Missing / Broken:** Teacher has **no dedicated notices page** and no way to see the full body/attachment of a notice from within the teacher portal. They can only see notice titles on the dashboard.  
**Impact:** Teachers cannot read full notice content from within the app.  
**Severity:** Low  
**Blocking Further Flow:** No  

---

### [ISSUE-023]
**Role:** Admin  
**Dashboard / Page:** Student Management — Batch Assignment  
**Flow Type:** Logic Flow  
**What Exists:** Admin can change a student's batch after account creation  
**What Is Missing / Broken:** When a student's batch is changed, **no StudentFee record is adjusted or created for the new batch**. The student's fee obligation remains tied to the old program/pricing. `autoCreateStudentFee` is only called at user creation time, not on batch updates.  
**Impact:** Students moved between batches/programs continue paying fees for their old program.  
**Severity:** Medium  
**Blocking Further Flow:** No  

---

### [ISSUE-024]
**Role:** Student  
**Dashboard / Page:** `/student/tests/[id]`  
**Flow Type:** Logic Flow  
**What Exists:** Student can take a test. Test has a `duration` field in minutes.  
**What Is Missing / Broken:** There is **no auto-submit when the timer runs out**. If the timer expires and the student does not manually submit, the test tab remains open indefinitely. The student could continue answering questions after time is up.  
**Impact:** Test integrity is compromised — students can take unlimited time.  
**Severity:** High  
**Blocking Further Flow:** No  

---

## Section 6: Overall System Readiness Score

| Category | Score | Notes |
|---|---|---|
| Public / Guest flows | 7/10 | Registration works, public pages functional; notice date filter issue |
| Student flows | 4/10 | Fee page is broken (field mismatch), no job status tracking, test auto-submit missing |
| Teacher flows | 5/10 | Core attendance + marks work; duplicate submission risk, no test UI |
| Admin flows | 6/10 | Strong CRUD coverage; bulk fee scope issue, no approval safeguards |
| Data consistency | 5/10 | Two fee systems, field name mismatch, dual library models |
| Navigation completeness | 6/10 | Several dead ends; test result page, job applications |
| Validation & error handling | 5/10 | Marks exceed max, attendance duplicate error unhandled, overdue lock |
| Security | 7/10 | Middleware now protects APIs; admin-created users bypass profile completion |

### **Overall Readiness: 5.1 / 10**

> The system is **not ready for client delivery** in its current state. The student fee display is broken (ISSUE-001), test auto-submit is missing (ISSUE-024), bulk fee assignment has a critical scope bug (ISSUE-017), and there are multiple navigation dead ends. These must be resolved before submission.

### Priority Fix Order
| # | Issue | Severity |
|---|---|---|
| 1 | ISSUE-001 — Student fee page field mismatch (shows ₹0) | Critical |
| 2 | ISSUE-024 — Test has no auto-submit on timer expiry | High |
| 3 | ISSUE-017 — Bulk fee assigns to ALL students if no batch given | High |
| 4 | ISSUE-005 — Admin-created students forced to complete-profile on first login | High |
| 5 | ISSUE-018 — No marks validation (marks > maxMarks allowed) | High |
| 6 | ISSUE-003 — Marks can be overwritten without confirmation | High |
| 7 | ISSUE-004 — Attendance duplicate date shows raw DB error | High |
| 8 | ISSUE-006 — Teacher has no test management page | High |
| 9 | ISSUE-002 — Fee page only shows first fee, ignores others | High |
| 10 | ISSUE-009 — Test result page has no back navigation | Medium |
