# Batch Management Module Design for LDM College ERP

## 1. Final Batch Data Structure

The required data structure for the Batch model in the ERP, addressing all requirements:

```typescript
// Proposed Mongoose Schema Structure (Logical)
interface IBatch {
    name: string;                // Unique, immutable global identifier (e.g. 2025BTECH, 2027BTECH)
    program: ObjectId;           // Reference to Program (Course)
    session: ObjectId;           // Optional: Links to broader Master Session if utilized
    
    // Core Intake Logistics
    intakeMonth: 'January' | 'July';
    joiningYear: number;
    courseDurationYears: number; // Inherited or snapped from Program
    
    // Calculated Lifecycles
    startDate: Date;             // Usually Jan 1 or Jul 1 of the joiningYear
    expectedEndDate: Date;       // Auto-calculated: (joiningYear + duration) Dec 31 / Jun 30
    actualEndDate?: Date;        // Only set when structurally finalized earlier/later than expected
    
    // Dashboard & Metrics
    capacity: number;            // Upper limit for the batch (default 60)
    current_students: number;    // Auto-calculated / Aggregated count of assigned active students
    current_semester: number;    // The active sem for this batch
    
    // Status
    status: 'upcoming' | 'active' | 'completed';
    is_active: boolean;          // Soft delete / global toggle flag
}
```

### Why this structure scales till 2040+:
1. **Mathematical Identifiers**: The `name` is algebraically generated and mathematically unique. It removes human typos. It scales indefinitely without collision.
2. **Explicit Dates over Strings**: Storing explicit `startDate` and `expectedEndDate` allowing time-series queries like "Show me all batches graduating next month".
3. **Decoupled Entities**: The batch ties precisely to a `Program` making it agnostic to future course taxonomy changes.

---

## 2. Pre-population Strategy (Idempotent 2020-2040)

To pre-populate batches intelligently without locking the system or creating unnecessary bloat:

**Trigger Paradigm:** We utilize a "Just-In-Time Pre-population Script" triggered asynchronously (e.g. Server Action or Admin explicit button `Initialize Era Batches 2020-2040`).

**The Algorithm (Pseudocode):**
1. Fetch all active `Programs` from the database.
2. Iterate `year` from `2020` to `2040`.
3. For each `year`, iterate `month` (January, July).
4. For each `Program`:
   - Compute `name`: 
     - If January: `year + program.code` (e.g., `2020BTECH`)
     - If July: `year + 2 + program.code` (e.g., `2022BTECH`)
   - Compute `startDate`: e.g. `YYYY-01-01` or `YYYY-07-01`
   - Compute `expectedEndDate`: based on `startDate` + `program.duration`
   - Compute `status`: based on `currentDate` vs `startDate` vs `expectedEndDate` (upcoming vs active vs completed)
5. **Idempotency Execution**: Use an `UPSERT` operation (e.g., MongoDB `updateOne( { name: computedName }, { $setOnInsert: newBatchData }, { upsert: true } )`).
   - *This guarantees running the script 100 times results in the exact same database state.*

---

## 3. Admin UI Flow

The Batch Management Dashboard must be highly functional, shifting from a mere "name holder" to a functional control room.

**A. Batch List View (`/admin/batches`)**
- A robust table (DataGrid) presenting:
  - **Batch ID/Name**: Highlighted explicitly.
  - **Course**: Program name.
  - **Intake**: Tag-style (❄️ Jan or ☀️ Jul).
  - **Start - End Year**: Quick graphical timeline view.
  - **Total Students**: Shows `count / capacity` (e.g., `45/60`).
  - **Status**: Status badge (Active: Green, Upcoming: Blue, Completed: Gray).
- **Actions:** Quick filters across Intake, Course, Status.

**B. Batch Detail View (`/admin/batches/[id]`)**
Clicking a batch transitions the view to:
- **Header**: High-level batch metrics (Name, Course, Est. Graduation, Active Semester).
- **Student Roster Tab:** A detailed tabular list of all associated students.
  - Clickable rows redirect explicitly to `/admin/students/[studentId]`.
- **Academics Tab:** Assignments or subjects actively linked to this batch.
- **Settings Tab:** Update capacity, push semester forward, manually mark completed.

---

## 4. Student-Batch Relationship & Audit

- **1:1 Cardinality:** A Student `User` document stores exactly one native `batch` reference (ObjectId).
- **Admin Supremacy:** Students have zero write-access to their batch.
- **Audit Trails:** Batch reassignments must not silently overwrite history. Mid-course transfers must log an `AuditLog` entry (e.g. `User {id} moved from Batch {A} to Batch {B} by Admin {adminId} on {date}`). 
- **Attendance Continuity:** Because attendance records tie to the student *and* the assignment layer, a student changing batches mid-course retains historical attendance mapped to their old subject sessions, while new attendance maps correctly to the new batch targets.

---

## 5. Permissions Architecture

- **Admin Layer**: Full CRUD. Unique ability to trigger the Pre-population script. Sole authority to execute multi-student batch reassignment.
- **Teacher Layer**: Read-only access contextually. A teacher sees a Batch *only* if they have an active `Assignment` mapped to that Batch. They can view the student roster of that batch strictly to mark attendance or grades.
- **Student Layer**: Zero visibility globally. They log in, API fetches their linked `Batch` reference, and UI exclusively displays their active peers, schedule, and cohort-specific notices.

---

## 6. Edge Cases Handled

- **Batch with Zero Students:** Expected behavior. Pre-population creates empty shells (`status: upcoming` or `active`). Empty batches simply do not appear in teacher assignment dropdowns until populated. Cost on DB is minimal (just a document index).
- **Batch Completed but Students Querying Records:** The `is_active` flag isn't necessary for historical access. The `status` becomes `completed`. Students logging in still resolve their `batch` relation, allowing them to pull transcripts and historical notices seamlessly. 
- **Student Moved to Another Batch Mid-Course (e.g. Year Back):** Admin initiates "Transfer Batch". The student's `batch` ref updates. All *future* assignments and attendance targets point to the new batch. *Past* assignment records remain physically bound to the old assignments ensuring data integrity.
- **Late Admission into an Already-Running Batch:** Standard enrollment workflow. The auto-compute system assigns them directly to the `active` batch. The interface recognizes their enrollment date, natively excusing them from attendance records generated prior to their creation date without breaking statistical aggregations.
