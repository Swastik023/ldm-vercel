# Backend Code Review Report

## Summary
| Severity | Count |
|---|---|
| 🔴 Critical (broken data flow) | 2 |
| 🟠 High (duplication/dead code) | 5 |
| 🟡 Medium (inconsistency/cleanup) | 4 |

---

## 🔴 Critical Issues

### 1. Student fee page reads from wrong collection
**Files:** `api/student/fees/route.ts` ↔ `api/admin/students/[id]/fees/route.ts`

**Problem:** Admin creates/updates fees using `StudentFee` model. But `GET /api/student/fees` reads from `FeeRecord` (a different collection entirely). Students can **never** see their fees.

```
Admin writes → StudentFee collection
Student reads → FeeRecord collection ← completely different!
```

**Fix:** Change `api/student/fees/route.ts` to read from `StudentFee` instead of `FeeRecord`.

---

### 2. POST /api/admin/students/[id]/fees still reads CoursePricing
**File:** `api/admin/students/[id]/fees/route.ts` line 81

**Problem:** The POST handler auto-fills `baseFee` by querying the old `CoursePricing` collection instead of `Program.pricing`. This is the old broken data source we migrated away from.

```ts
// Line 81 — WRONG
const pricing = await CoursePricing.findOne({ courseId });
// Should be:
const program = await Program.findOne({ code: courseId });
const baseFee = program.pricing.totalFee;
```

**Fix:** Replace `CoursePricing` lookup with `Program.findOne({ code: courseId })` then read `program.pricing`.

---

## 🟠 High Issues

### 3. Three parallel fee models doing the same thing
**Models:** `StudentFee.ts`, `FeeRecord.ts`, `FeePayment.ts + FeeStructure.ts`

| Model | Used by | Purpose |
|---|---|---|
| `StudentFee` | admin/fees panel, student profile | Active fee tracking per student |
| `FeeRecord` | `admin/finance/fee-records` API | Duplicate fee tracking (old ERP) |
| `FeePayment` + `FeeStructure` | `admin/finance/payments` API | Another parallel system (academic ERP style) |

**Problem:** All three do fee management. Only `StudentFee` is actively used in the main admin fee panel. The other two create confusion and dead DB collections.

**Fix:** Keep `StudentFee` as the sole source. Deprecate `FeeRecord`, `FeeStructure`, `FeePayment`— remove their API routes or clearly label them as unused until fully deleted.

---

### 4. Two parallel Library models for different features
**Models:** `Library.ts` (simple), `LibraryDocument.ts` (advanced)

| Model | Used by |
|---|---|
| `Library` | `api/public/library`, old admin library upload |
| `LibraryDocument` | `api/admin/library/documents`, new versioned library |

**Problem:** Two library systems coexist. The public library page reads from `Library` (old). The new admin uploads are in `LibraryDocument` with versioning, categories etc. Public page never shows the newer richer content.

**Fix:** Public library API should read from `LibraryDocument`. Migrate any old `Library` records. Delete `Library.ts`.

---

### 5. Two document submission systems
**Models:** `StudentDocuments.ts` (admission docs), `DocumentSubmission.ts` (DMS V2)

| Model | Used by | Purpose |
|---|---|---|
| `StudentDocuments` | `api/admin/students/[id]/documents`, registration flow | Admission documents (photo, marksheets, Aadhaar) |
| `DocumentSubmission` | `api/admin/documents/submissions`, `api/teacher/documents` | Ongoing document requirements system |

**Note:** These serve different purposes — admission docs vs ongoing requirements — so both are needed. But the `StudentDocuments` model has a **legacy `aadhaarIdUrl` field** kept alongside the newer `aadhaarFrontUrl + aadhaarBackUrl` split fields. This creates ambiguity in validation code.

**Fix:** Remove `aadhaarIdUrl` / `aadhaarIdType` from `StudentDocuments` schema (or mark deprecated). Update any reads to check new fields only.

---

### 6. CoursePricing model is now orphaned but still imported
**File:** `api/admin/students/[id]/fees/route.ts` line 7

**Problem:** `CoursePricing` model is still imported and used in one POST handler (Issue #2 above). The model itself still exists in `/models/CoursePricing.ts` even though we migrated to `Program.pricing`.

**Fix:** After fixing Issue #2, the model becomes unused. Delete `CoursePricing.ts` and its import.

---

### 7. `/api/admin/course-pricing/route.ts` is now a dead API
**File:** `api/admin/course-pricing/route.ts`

**Problem:** This API was originally paired with the `admin/course-pricing/page.tsx` which was deleted. The API has been rewritten to use Program model — but no UI calls it anymore. Fee management is now fully in `admin/courses` (via `Program.pricing`).

**Fix:** Delete `api/admin/course-pricing/route.ts`.

---

## 🟡 Medium Issues

### 8. `round2` helper duplicated in 2 files
**Files:** `api/admin/fees/course/route.ts` line 9, `api/admin/students/[id]/fees/route.ts` line 16

Both define identical `const round2 = (n: number) => Math.round(n * 100) / 100`. Should be in a shared lib utility.

**Fix:** Move to `lib/math.ts`, import in both files.

---

### 9. Auth guard pattern inconsistent across routes
**Problem:** Some routes use `getServerSession(authOptions)` + manual role check. Some check `session?.user?.id`, others check `session?.user`. No shared `adminOnly()` helper — each file reimplements the guard slightly differently.

**File examples:**
- `api/admin/courses/[id]/route.ts` — uses local `adminOnly()` function ✓
- `api/admin/fees/course/route.ts` — inline `session.user.role !== 'admin'` ✗
- `api/admin/students/[id]/fees/route.ts` — inline, checks `session?.user?.id` ✗

**Fix:** Create `lib/auth-guards.ts` exporting `requireAdmin(session)`, `requireStudent(session)`, `requireTeacher(session)` that return 401 response or null. Use everywhere.

---

### 10. `api/public/programs` and `api/public/courses` return near-identical data
**Files:** `api/public/programs/route.ts`, `api/public/courses/route.ts`

Both fetch from `Program` model and map to similar shapes. The courses page uses `/api/public/courses` but other components may hit `/api/public/programs`. Two endpoints doing the same thing.

**Fix:** Keep `/api/public/courses`. Check if `/api/public/programs` has unique consumers. If not, delete it.

---

### 11. Sync and migrate routes should be removed after use
**Files:** `api/admin/courses/migrate/route.ts`, `api/admin/courses/sync-pricing/route.ts`

These are one-time migration scripts exposed as API routes. Now that the data migration is complete, they should be removed before production hardens — especially `sync-pricing` which uses a hardcoded secret token.

**Fix:** Delete both after confirming migration is complete. Or at minimum, move them behind proper admin session auth and document them as maintenance routes.

---

## Recommended Cleanup Order

1. **Fix #1** — Student fees reads wrong collection (CRITICAL — students can't see fees)
2. **Fix #2** — Replace CoursePricing in POST handler with Program model
3. **Fix #6** — Delete CoursePricing.ts after #2
4. **Fix #7** — Delete dead admin/course-pricing API route
5. **Fix #4** — Migrate public library to read LibraryDocument
6. **Fix #8** — Extract round2 to shared lib
7. **Fix #9** — Create auth guard utility
8. **Fix #10** — Audit and remove /api/public/programs if unused
9. **Fix #11** — Remove migrate/sync-pricing routes when ready
