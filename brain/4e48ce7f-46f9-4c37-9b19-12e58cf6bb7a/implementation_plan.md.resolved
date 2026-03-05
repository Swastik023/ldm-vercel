# Seed Curriculum Data & Fix Course Display Logic

## Problem Summary

1. **14 rich diploma JSON files** exist in `ai_output/diploma/` with detailed content (overview, 4-semester syllabus, practicals, internship, assessment, career, engagement) — but none of this is in the database.
2. The `Program` model in `Academic.ts` only stores basic fields: `description`, `syllabus: string[]`, `careerOptions: string[]`.
3. The frontend (`CourseDetailClient.tsx`) only renders: description, flat syllabus list, and career tags.
4. New courses added via admin appear with missing/broken sections because the schema is too thin.

---

## User Review Required

> [!IMPORTANT]
> This plan adds a new `curriculum` embedded sub-document to the Program model. This is a **schema extension** — existing programs without curriculum data will continue working (all fields are optional). No existing data is deleted.

> [!WARNING]
> The seed script will **upsert** (update if exists, skip creation) — it will NOT delete old programs. It only enriches existing programs with curriculum data matched by `code`.

---

## Proposed Changes

### 1. Database — Extend Program Schema

#### [MODIFY] [Academic.ts](file:///media/swastik/focus/ldm%20feb/src/models/Academic.ts)

Add a new `curriculum` embedded sub-document to the `ProgramSchema` with these optional fields:

```typescript
curriculum: {
  overview: { clinical_rationale, role_of_professional, ... }   // Rich text strings
  academic_structure: { duration, total_semesters, core_competencies[], training_framework }
  detailed_syllabus: [{ semester, title, units: [{ unit_no, title, content }] }]
  practical_procedures: [{ title, steps[] }]
  case_scenarios: [{ title, situation, workflow[] }]
  internship: { duration, rotations[], objectives[] }
  assessment: { theory_exams, practical_viva, ... }
  student_engagement: string[]
}
```

All fields are **optional** with defaults, so old records are unaffected.

---

### 2. Seed Script — Push Curriculum JSONs to Database

#### [NEW] [seed_curriculum.js](file:///media/swastik/focus/ldm%20feb/scripts/seed_curriculum.js)

A Node.js script following the existing `seed_real.js` pattern:
- Connects to MongoDB using `MONGODB_URI` from `.env` / `.env.local`
- Reads all `.json` files from `ai_output/diploma/` (and later `ai_output/certificate/`)
- For each JSON: finds the matching `Program` by `code` (case-insensitive)
- Updates the program with:
  - `description` → from `overview.clinical_rationale` (first 500 chars)
  - `careerOptions` → from `career_pathways`
  - `syllabus` → flattened semester unit titles
  - `curriculum` → the full rich JSON (overview, detailed_syllabus, etc.)
- Logs results per file: updated, skipped (not found), or errored
- **Does NOT delete any data**

---

### 3. Public API — Expose Curriculum Data

#### [MODIFY] [route.ts](file:///media/swastik/focus/ldm%20feb/src/app/api/public/courses/route.ts)

Add `course_type` and `hasCurriculum: !!p.curriculum` to the list response (no need for full curriculum in the listing).

#### [MODIFY] [page.tsx (server)](file:///media/swastik/focus/ldm%20feb/src/app/%28public%29/courses/%5Bid%5D/page.tsx)

Pass the full `curriculum` object from the Program model to `CourseDetailClient`, alongside existing fields.

---

### 4. Frontend — Dynamic Section Rendering

#### [MODIFY] [CourseDetailClient.tsx](file:///media/swastik/focus/ldm%20feb/src/app/%28public%29/courses/%5Bid%5D/CourseDetailClient.tsx)

Extend the `CourseData` interface to include an optional `curriculum` object. Render sections dynamically **only if data exists**:

- **Program Overview** — `curriculum.overview` (clinical_rationale, role_of_professional)
- **Academic Structure** — core competencies, training framework
- **Detailed Semester Syllabus** — expandable accordion for each semester with units
- **Practical Procedures** — step-by-step cards
- **Internship Details** — rotations and objectives
- **Assessment Methodology** — evaluation criteria
- **Career Pathways** — enhanced tags from `curriculum.career_pathways` (falls back to basic `career[]`)
- **Student Engagement** — activities list

**Key principle**: Every section checks `if (curriculum?.section)` before rendering. Old courses without curriculum data still display fine with the basic description/syllabus/career layout.

---

### 5. Admin Panel — No Changes Required (Yet)

The admin panel already manages basic fields. The rich curriculum data comes from the JSON files via the seed script. Admin enhancements (image upload, brochure, SEO fields) can be Phase 2 after this works.

---

## Verification Plan

### Automated Tests

1. **Seed script dry-run**:
   ```bash
   cd "/media/swastik/focus/ldm feb"
   node scripts/seed_curriculum.js
   ```
   Expected: Logs showing 14 diploma programs updated successfully.

2. **TypeScript build check**:
   ```bash
   cd "/media/swastik/focus/ldm feb"
   npx next build 2>&1 | head -50
   ```
   Expected: No TypeScript compilation errors from modified files.

3. **API response check** (after dev server is running):
   ```bash
   curl http://localhost:3000/api/public/courses | python3 -m json.tool | head -30
   ```
   Expected: Courses list with `hasCurriculum` field.

### Manual Verification

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000/courses` — verify all courses display in the grid without errors
3. Click on a course that has curriculum data (e.g., DCCM) — verify **all new sections render**: Overview, Semester Syllabus, Practicals, Internship, Assessment, Career, Engagement
4. Click on a course that does NOT have curriculum data (e.g., GDA, MBA-HA) — verify the page still works with just the basic layout (no crashes, no empty white sections)
5. Check admin panel at `/admin/courses` — verify all courses still list correctly

