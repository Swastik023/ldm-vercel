# DMS V2 — Upgrade Plan

Major upgrade: Dynamic form builder, dedicated Teacher APIs/UI, bulk ZIP download, secure temporary links, and download auditing.

---

## User Review Required

> [!IMPORTANT]
> **Dynamic Form Builder Strategy:** Custom fields (text, file, dropdown, date, checkbox) will be stored as a `custom_fields[]` array in `DocumentRequirement`. Student submissions will store JSON responses in a `form_responses` map. File-type fields will still upload to Cloudinary. This gives full flexibility without needing a separate `FormTemplate` model.

> [!WARNING]
> **Bulk ZIP Downloads:** ZIP files will be generated server-side using the `archiver` npm package and streamed. For very large batches (100+ files), this is memory-intensive. The plan uses **streaming** to avoid memory issues, but files over ~500MB total may time out on Vercel. For production scale, consider moving ZIP generation to a background job.

> [!IMPORTANT]
> **Teacher Course Restriction:** Teachers will only see/manage requirements linked to subjects they are assigned to via the existing `Assignment` model (`teacher → subject → batch`). No schema change needed for the User model.

---

## Updated Database Schema

### [MODIFY] [DocumentRequirement.ts](file:///media/swastik/focus/ldm%20feb/src/models/DocumentRequirement.ts)

Add `custom_fields` array for the dynamic form builder:

```diff
 export interface IDocumentRequirement extends Document {
     title: string;
     description?: string;
     category: 'personal_document' | 'academic' | 'assignment' | 'certificate';
     required_file_types: string[];
     max_file_size_mb: number;
     is_mandatory: boolean;
     due_date?: Date;
     scope: { ... };
     subject?: mongoose.Types.ObjectId;
     created_by: mongoose.Types.ObjectId;
     is_active: boolean;
+    custom_fields: ICustomField[];      // Dynamic form fields
+    requires_file_upload: boolean;       // Whether file upload is needed
 }
+
+export interface ICustomField {
+    field_id: string;                     // UUID, used as key in responses
+    label: string;                        // "Roll Number", "Date of Birth"
+    field_type: 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file';
+    is_required: boolean;
+    placeholder?: string;
+    options?: string[];                   // For dropdown fields
+    max_length?: number;                  // For text/textarea
+    allowed_file_types?: string[];        // For file-type fields
+    max_file_size_mb?: number;            // For file-type fields
+    order: number;                        // Display order
+}
```

### [MODIFY] [DocumentSubmission.ts](file:///media/swastik/focus/ldm%20feb/src/models/DocumentSubmission.ts)

Add `form_responses` for storing dynamic field answers:

```diff
 export interface IDocumentSubmission extends Document {
     requirement: mongoose.Types.ObjectId;
     student: mongoose.Types.ObjectId;
-    file_url: string;
-    file_name: string;
-    file_type: string;
-    file_size: number;
-    cloudinary_public_id: string;
+    file_url?: string;                   // Optional (no file if form-only)
+    file_name?: string;
+    file_type?: string;
+    file_size?: number;
+    cloudinary_public_id?: string;
+    form_responses: Map<string, any>;    // { field_id → value }
+    additional_files: IAdditionalFile[]; // Extra file uploads from file-type fields
     status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
     review: { ... };
     submission_history: ISubmissionHistoryEntry[];
 }
+
+export interface IAdditionalFile {
+    field_id: string;                     // Links to custom_field.field_id
+    file_url: string;
+    file_name: string;
+    file_type: string;
+    file_size: number;
+    cloudinary_public_id: string;
+}
```

### [MODIFY] [AuditLog.ts](file:///media/swastik/focus/ldm%20feb/src/models/AuditLog.ts)

Add download actions to the action enum:

```diff
 action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'upload'
+       | 'download' | 'bulk_download'
```

---

## API Structure

### Dedicated Teacher APIs (NEW)

| Route | Method | Purpose |
|---|---|---|
| `/api/teacher/documents/requirements` | GET | List requirements for teacher's assigned subjects |
| `/api/teacher/documents/requirements` | POST | Create assignment-type requirement with custom fields |
| `/api/teacher/documents/requirements/[id]` | GET, PUT, DELETE | Manage own requirements |
| `/api/teacher/documents/submissions` | GET | List submissions for teacher's requirements only |
| `/api/teacher/documents/submissions/[id]/review` | PUT | Approve/reject |
| `/api/teacher/documents/submissions/[id]/download` | GET | Download single file (generates secure temp URL) |
| `/api/teacher/documents/submissions/bulk-download` | POST | ZIP download by requirement or batch |

### Updated Admin APIs

| Route | Method | Purpose |
|---|---|---|
| `/api/admin/documents/submissions/bulk-download` | POST | ZIP export (by requirement, batch, or custom filter) |
| `/api/admin/documents/submissions/[id]/download` | GET | Secure temp download link (updated) |

### Updated Student API

| Route | Change |
|---|---|
| `/api/student/documents` | Now returns `custom_fields` array in each requirement |
| `/api/student/documents/upload` | Accepts `form_responses` JSON + optional file uploads |

---

## Authorization Matrix

| Action | Admin | Teacher | Student |
|---|---|---|---|
| Create any requirement | ✅ | ❌ | ❌ |
| Create assignment requirement | ✅ | ✅ (own subjects only) | ❌ |
| Add custom form fields | ✅ | ✅ (own requirements) | ❌ |
| View all submissions | ✅ | ❌ | ❌ |
| View own-subject submissions | ✅ | ✅ | ❌ |
| Approve/Reject | ✅ | ✅ (own subjects) | ❌ |
| Bulk download (any) | ✅ | ❌ | ❌ |
| Bulk download (own subjects) | ✅ | ✅ | ❌ |
| Submit/upload documents | ❌ | ❌ | ✅ |
| View own submissions | ❌ | ❌ | ✅ |

**Teacher subject filtering:** Uses `Assignment.find({ teacher: teacherId })` to get subject IDs, then only shows `DocumentRequirement` entries where `created_by` = teacher OR `subject` ∈ teacher's assigned subjects.

---

## Flow Diagrams

### Dynamic Form Builder Flow

```
Admin/Teacher creates requirement
        │
        ├── Adds title, scope, due date
        └── Opens Form Builder
                │
                ├── Adds "Roll Number" (text, required)
                ├── Adds "Date of Birth" (date)
                ├── Adds "Category" (dropdown: General/OBC/SC/ST)
                ├── Adds "Photo ID" (file: jpg/png, max 2MB)
                └── Adds "Declaration" (checkbox: "I agree...")
                │
                ▼
        custom_fields[] saved in DocumentRequirement
                │
                ▼
        Student sees dynamic form
                │
                ├── Fills text/date/dropdown fields
                ├── Checks checkbox
                ├── Uploads file for "Photo ID" field
                └── Optionally uploads main document
                │
                ▼
        form_responses: {
            "field_uuid_1": "RS2024001",
            "field_uuid_2": "2005-03-15",
            "field_uuid_3": "OBC",
            "field_uuid_4": true
        }
        additional_files: [{ field_id: "field_uuid_5", file_url: "..." }]
```

### Bulk Download Flow

```
Admin/Teacher clicks "Bulk Download"
        │
        ├── Selects requirement (e.g. "Aadhaar Card")
        ├── Optionally filters by batch or status
        │
        ▼
POST /api/.../bulk-download
  { requirementId, batchId?, status? }
        │
        ├── Query matching submissions
        ├── Fetch files from Cloudinary URLs
        ├── Stream into ZIP (using archiver)
        │   ├── StudentName_RollNo_FileName.pdf
        │   ├── StudentName_RollNo_FileName.pdf
        │   └── ...
        ├── Log bulk_download in AuditLog
        └── Stream ZIP response to browser
```

---

## Bulk Download Strategy

- **Library:** `archiver` npm package (popular, streaming, no temp files)
- **File naming:** `{StudentName}_{FileName}.{ext}` inside ZIP
- **Streaming:** ZIP is streamed to the response as it's built — no memory accumulation
- **File fetching:** Each Cloudinary URL fetched via `fetch()` and piped to archiver
- **Security:** Same role checks as single download, plus audit log entry
- **Limits:** Max 200 files per bulk download to prevent timeouts

## Secure Download Strategy

- **Current V1:** Returns raw Cloudinary URL directly
- **V2 Upgrade:** Generate Cloudinary **signed URLs** with 15-minute expiry
- Uses `cloudinary.utils.private_download_url()` or signed URL generation
- Every download (single and bulk) logged in `AuditLog` with `action: 'download'`

---

## New UI Pages

### [NEW] Teacher Documents Page (`/teacher/documents`)

Two-tab layout (mirrors admin but scope-restricted):
- **My Requirements:** Create/edit assignment requirements with form builder
- **Student Submissions:** Review, approve/reject, single + bulk download

### [MODIFY] Admin Documents Page (`/admin/documents`)

- Add **Bulk Download** button (per requirement or batch filters)
- Add **Form Builder** UI in the create/edit requirement form

### [MODIFY] Student Documents Page (`/student/documents`)

- Dynamic form rendering based on `custom_fields[]`
- Each field type renders correct input (text, dropdown, datepicker, checkbox, file)
- `form_responses` sent as JSON alongside optional file upload

---

## Implementation Phases

### Phase 1: Schema Upgrades
- Update `DocumentRequirement` model (add `custom_fields`, `requires_file_upload`)
- Update `DocumentSubmission` model (add `form_responses`, `additional_files`, make file fields optional)
- Update `AuditLog` action enum

### Phase 2: Teacher APIs (7 routes)
- Requirements CRUD scoped to teacher's assigned subjects
- Submissions listing with teacher scope
- Review (approve/reject) endpoint
- Single download with secure temp link

### Phase 3: Bulk Download API
- `POST /api/admin/documents/submissions/bulk-download`
- `POST /api/teacher/documents/submissions/bulk-download`
- Install `archiver`, stream ZIP, audit logging

### Phase 4: Update Student APIs
- Accept `form_responses` JSON in upload route
- Handle additional file fields
- Return `custom_fields` in requirements listing

### Phase 5: Teacher UI
- New page at `/teacher/documents`
- Form builder UI for custom fields
- Teacher sidebar link

### Phase 6: Update Admin UI
- Add form builder to requirement create/edit form
- Add bulk download button
- Secure download links

### Phase 7: Update Student UI
- Dynamic form renderer (text, dropdown, date, checkbox, file inputs)
- Submit form responses alongside file upload

### Phase 8: Verification
- Build check
- Manual workflow test

---

## Verification Plan

**Automated:** `npx tsc --noEmit` build check after each phase

**Manual testing:**
1. Admin creates requirement with custom fields → Student sees dynamic form
2. Teacher creates assignment → only sees own subject submissions
3. Student fills form + uploads → form_responses stored correctly
4. Admin bulk downloads all Aadhaar submissions → ZIP downloads
5. Teacher bulk downloads assignment submissions → scoped correctly
6. Download audit log entries verified
