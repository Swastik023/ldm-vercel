// Last Updated: 2026-02-27

export type Step = {
    step: number;
    title: string;
    description: string;
    detail?: string;      // extra paragraph below description
    tip?: string;
    warning?: string;
    note?: string;        // neutral info box
};

export type Article = {
    id: string;
    title: string;
    lastUpdated: string;
    summary: string;
    overview?: string[];  // bullet-point key facts shown before steps
    flowDiagram?: string; // Mermaid graph definition
    steps: Step[];
    relatedIds?: string[];
};

export type Category = {
    id: string;
    label: string;
    icon: string; // emoji
    articles: Article[];
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SOP DATA
// ─────────────────────────────────────────────────────────────────────────────

export const adminCategories: Category[] = [
    {
        id: 'getting-started',
        label: 'Getting Started',
        icon: '🚀',
        articles: [
            {
                id: 'admin-login',
                title: 'How to Log In as Admin',
                lastUpdated: '2026-02-27',
                summary: 'Log into the LDM admin panel using your admin credentials.',
                overview: [
                    'Admin accounts are pre-created — no self-registration is allowed.',
                    'The login page is at /login for all roles.',
                    'After login you are redirected to /admin automatically.',
                ],
                flowDiagram: `flowchart TD
    A([Open Browser]) --> B[Go to /login]
    B --> C[Enter Admin Email + Password]
    C --> D{Credentials valid?}
    D -- Yes --> E[Redirected to /admin Dashboard]
    D -- No --> F[Error shown on form]
    F --> C
    E --> G([Admin Dashboard Loaded ✓])`,
                steps: [
                    { step: 1, title: 'Navigate to the Login Page', description: 'Open your browser and go to https://www.ldmcollege.com/login. You will see the LDM College sign-in screen with Email and Password fields plus a Google Sign-In option.', note: 'Use a modern browser (Chrome, Firefox, Edge). The system does not support Internet Explorer.' },
                    { step: 2, title: 'Enter Your Admin Credentials', description: 'Type your registered admin email address in the Email field and your password in the Password field.', detail: 'Admin accounts are created by the system owner directly in the database. Only users with role=admin can access /admin. If you have never logged in before, ask the system owner for your initial credentials.', tip: 'If you forgot your password, contact the system owner to reset it directly in the database or via the MongoDB Atlas UI.' },
                    { step: 3, title: 'Click Sign In', description: 'Click the blue "Sign In" button. The system validates your email/password against the database.', detail: 'If validation succeeds, NextAuth creates a secure session cookie. You are then automatically redirected to /admin.' },
                    { step: 4, title: 'Confirm the Dashboard Loads', description: 'The admin dashboard shows 4 green stat cards at the top: Total Students, Total Revenue, Pending Approvals, and a system status indicator. If you see these, you are fully logged in.', tip: 'Bookmark /admin/dashboard (Ctrl+D) for quick daily access.', warning: 'If you see a "403 Forbidden" or are redirected back to /login, your account role may not be set to admin. Contact the system owner.' },
                ],
                relatedIds: ['admin-dashboard-overview'],
            },
            {
                id: 'admin-dashboard-overview',
                title: 'Admin Dashboard Overview',
                lastUpdated: '2026-02-27',
                summary: 'Understand the key metrics and sections on the admin dashboard.',
                steps: [
                    { step: 1, title: 'Stats Cards (Top Row)', description: 'The top row shows: Total Students (active enrolled), Total Revenue (from fee payments), Pending Approvals (student accounts awaiting review), and system health indicators.' },
                    { step: 2, title: 'Sidebar Navigation', description: 'The left sidebar is grouped into 6 sections: Overview, People, Academic, Finance, Library & Docs, and Communication. Click any group header to expand/collapse it.' },
                    { step: 3, title: 'Recent Activity', description: 'The dashboard lists recent registrations, fee payments, and document uploads in chronological order.' },
                    { step: 4, title: 'Finance Overview', description: 'Visit Admin → Finance → Finance Dashboard for a full breakdown of revenue, expenses, salaries, and outstanding fees.' },
                ],
            },
        ],
    },
    {
        id: 'student-management',
        label: 'Student Management',
        icon: '👥',
        articles: [
            {
                id: 'approve-students',
                title: 'Approving Student Registrations',
                lastUpdated: '2026-02-27',
                summary: 'Review and approve students who have registered and submitted their documents.',
                overview: [
                    'Students register themselves — admin must manually approve each one.',
                    'A student with "Pending" status cannot use any ERP features until approved.',
                    'Documents must be verified before approval: Photo, 10th, 12th, Aadhaar.',
                    'Rejected students see the reason and can re-upload and resubmit.',
                ],
                flowDiagram: `flowchart TD
    A([Student Registers]) --> B[Status = Pending]
    B --> C[Admin opens Students page]
    C --> D[Filter: Status = Pending]
    D --> E[Click student row]
    E --> F[Open Documents tab]
    F --> G{All docs uploaded\nand legible?}
    G -- Yes --> H[Go to Edit tab]
    H --> I[Set Status = approved]
    I --> J[Click Save]
    J --> K([Student Activated ✓])
    G -- No --> L[Note missing/bad docs]
    L --> M[Go to Edit tab]
    M --> N[Set Status = rejected]
    N --> O[Add rejection reasons per doc]
    O --> P[Click Save]
    P --> Q([Student notified — can resubmit])`,
                steps: [
                    { step: 1, title: 'Open the Students Page', description: 'Click "Students" in the left sidebar (under the People group). A paginated table of all registered students loads, showing name, email, roll number, batch, and status badge.', detail: 'The page fetches 25 students per page by default. Use the pagination controls at the bottom to navigate.' },
                    { step: 2, title: 'Filter to Pending Students Only', description: 'Click the Status dropdown (top-right of the table) and select "Pending". The list now shows only students awaiting review.', tip: 'You can also search by name or roll number using the search box to find a specific student quickly.' },
                    { step: 3, title: 'Open the Student Detail Modal', description: 'Click the eye/view icon on the right side of any student row, or click anywhere on the row. A full-screen modal opens with 3 tabs: Overview, Documents, and Edit.' },
                    { step: 4, title: 'Review the Documents Tab', description: 'Click the "Documents" tab inside the modal. A grid shows all 4 mandatory document slots: Passport Photo, 10th Marksheet, 12th Marksheet, and Aadhaar Card.', detail: 'For each slot: if the student uploaded a file, you will see a thumbnail or a PDF icon with a Download button. If the slot shows "Not Uploaded", the student has not submitted that document yet.', warning: 'Do not approve a student if any mandatory document slot is empty or the uploaded file is blurry/incorrect.' },
                    { step: 5, title: 'Verify Each Document', description: 'For images (Passport Photo, Aadhaar), click the thumbnail to open a full-screen preview. Check that the photo is clear, recent, and shows the student\'s face. For marksheets, click Download and open the PDF to check it is the correct document and all markings are legible.' },
                    { step: 6, title: 'Approve the Student', description: 'If all documents are correct, switch to the "Edit" tab. Change the Status dropdown from "Pending" to "active". Click Save. The student\'s account is now active and they can log in and use the ERP.', tip: 'The student will see their status change to Active on their dashboard immediately after you save.' },
                    { step: 7, title: 'Reject with Reasons (if needed)', description: 'If documents are missing or incorrect, set the Status dropdown to "rejected" in the Edit tab. In the Rejection Reasons text area, type specific reasons (e.g., "Passport photo is blurry — please resubmit a clear photo"). Click Save.', warning: 'Be clear and specific in rejection reasons. Vague reasons like "documents incomplete" cause confusion and delays.' },
                ],
                relatedIds: ['reject-students', 'view-student-docs'],
            },
            {
                id: 'reject-students',
                title: 'Rejecting & Providing Rejection Reasons',
                lastUpdated: '2026-02-27',
                summary: 'Reject a student registration with specific reasons for each document or field.',
                steps: [
                    { step: 1, title: 'Open the Student Modal', description: 'Find the student in the Students list and click their row to open the detail modal.' },
                    { step: 2, title: 'Go to Edit Tab', description: 'Click the "Edit" tab inside the modal. You will see fields to edit the status and add rejection reasons.' },
                    { step: 3, title: 'Set Status to Rejected', description: 'Change the Status dropdown to "rejected".' },
                    { step: 4, title: 'Add Rejection Reasons', description: 'Fill in the "Rejection Reasons" field for specific documents (e.g., "Photo is blurry", "Marksheet not legible"). These are shown to the student.' },
                    { step: 5, title: 'Save Changes', description: 'Click Save. The student will see the rejection reason on their dashboard and can re-upload corrected documents.', tip: 'Be specific in rejection reasons to help students correct quickly.' },
                ],
            },
            {
                id: 'view-student-docs',
                title: 'Viewing Student Documents',
                lastUpdated: '2026-02-27',
                summary: 'View, download, and verify all documents uploaded by a student.',
                steps: [
                    { step: 1, title: 'Open Student Modal', description: 'Click any student row in Admin → Students to open their detail modal.' },
                    { step: 2, title: 'Switch to Documents Tab', description: 'Click "Documents" in the modal tabs. You will see all uploaded documents in a grid.' },
                    { step: 3, title: 'View Images', description: 'For image files (JPG, PNG), click the thumbnail to open a full-screen preview directly in the browser.' },
                    { step: 4, title: 'Download PDFs', description: 'For PDFs and other files, click the Download button to save the file locally.' },
                    { step: 5, title: 'Custom Documents', description: 'Custom documents requested by admins appear in a separate section below the standard slots. Each has a title and file type.', tip: 'If a document slot shows "Not Uploaded", the student has not submitted it yet.' },
                ],
            },
            {
                id: 'manage-fees-student',
                title: 'Managing Student Fees (Fee Records)',
                lastUpdated: '2026-02-27',
                summary: 'Add, edit, and track fee records and payments for individual students.',
                overview: [
                    'Each student can have multiple fee records (one per semester/year).',
                    'Final Fee = Base Fee − (Base Fee × Discount%). You can override Final Fee directly.',
                    'Payment history is kept per fee record with date and notes.',
                    'Deleting a fee record also deletes its payment history — irreversible.',
                ],
                flowDiagram: `flowchart TD
    A([Open Student Modal]) --> B[Click Fees Tab]
    B --> C{Action?}
    C -- Add new fee --> D[Fill Label + Year + Base Fee + Disc%]
    D --> E[System previews Final Fee]
    E --> F[Click Add]
    F --> G([Fee record created ✓])
    C -- Record payment --> H[Click + Payment on record]
    H --> I[Enter Amount + Note]
    I --> J[Click Save]
    J --> K([Paid & Left updated ✓])
    C -- Edit fee --> L[Click Edit on record]
    L --> M[Change Base/Disc%/Final Fee]
    M --> N[Click Save]
    N --> O([Fee record updated ✓])
    C -- Delete fee --> P[Click trash icon]
    P --> Q[Confirm deletion]
    Q --> R([Record + payments deleted])`,
                steps: [
                    { step: 1, title: 'Open the Student Detail Modal', description: 'Go to Admin → Students. Find the student using the search box or scroll the list. Click their row to open the detail modal.' },
                    { step: 2, title: 'Switch to the Fees Tab', description: 'Inside the modal, click the "Fees" tab (third tab). You will see the Add Fee form at the top and any existing fee records listed below.' },
                    { step: 3, title: 'Add a Fee Record — Fill the Form', description: 'Fill in: Fee Label (e.g. "Semester 1 Fee" or "Annual Fee 2024-25"), Academic Year (e.g. "2024-25"), Base Fee (₹ amount — this is the course fee before discount), and Discount % (enter 0 if no discount applies).', detail: 'As you type Base Fee and Discount %, the form shows a live preview of the Final Fee. For example: Base ₹60,000 with 10% discount = Final ₹54,000.', tip: 'Use the Course Pricing page to check the standard base fee for each course before entering manually.' },
                    { step: 4, title: 'Click Add to Create the Record', description: 'Click the blue "Add" button. The new fee record appears in the list below with 5 data chips: Base | Disc % | Final | Paid | Left.', note: 'The Paid chip starts at ₹0 and the Left chip equals the Final Fee until payments are recorded.' },
                    { step: 5, title: 'Record a Payment', description: 'Click the green "+ Payment" button on any fee record. A small form appears: enter the Payment Amount (₹) and an optional Note (e.g. "Cash — 15 Feb 2026" or "Online transfer #TXN123"). Click Save.', detail: 'The Paid chip increases and the Left chip decreases instantly. A timestamped entry is added to the payment history of that record.' },
                    { step: 6, title: 'Edit an Existing Fee Record', description: 'Click the grey "Edit" button on a fee record to open an inline edit form. You can change Base Fee, Discount %, or Final Fee. The system recalculates the other values automatically when you change one.', warning: 'Changing the Final Fee manually overrides the discount calculation. Be careful not to accidentally lower a student\'s fee without authorization.' },
                    { step: 7, title: 'Delete a Fee Record', description: 'Click the red trash/bin icon on a fee record. A confirmation prompt appears. Confirm to permanently delete the record and ALL its payment history.', warning: 'Deletion is permanent and cannot be undone. Only delete test records or genuine errors.' },
                ],
                relatedIds: ['bulk-fee-assignment', 'course-fee-management'],
            },
        ],
    },
    {
        id: 'academic',
        label: 'Academic Configuration',
        icon: '🎓',
        articles: [
            {
                id: 'create-program',
                title: 'Creating a Program (Course)',
                lastUpdated: '2026-02-27',
                summary: 'Add a new academic program such as B.Pharm or D.Pharm.',
                steps: [
                    { step: 1, title: 'Go to Academic Config', description: 'Click "Configuration" under the Academic group in the sidebar. This opens the Academic Management page.' },
                    { step: 2, title: 'Open Programs Tab', description: 'The page defaults to the Programs tab. You will see existing programs and an "Add Program" form on the left.' },
                    { step: 3, title: 'Fill the Form', description: 'Enter: Program Name (e.g. "B.Pharm"), Program Code (e.g. "BPHARM"), Duration in Years (e.g. 4), and Total Semesters (e.g. 8).' },
                    { step: 4, title: 'Click Create Program', description: 'Click the blue "Create Program" button. The new program appears instantly in the list on the right.' },
                    { step: 5, title: 'Edit a Program', description: 'Click the pencil icon on any existing program to edit its name, code, duration, or semester count inline. Click Save when done.' },
                ],
            },
            {
                id: 'create-session',
                title: 'Creating Academic Sessions',
                lastUpdated: '2026-02-27',
                summary: 'Add academic year sessions (e.g. 2024-2025) and mark them as active.',
                steps: [
                    { step: 1, title: 'Go to Academic Config', description: 'Click "Configuration" in the sidebar under Academic.' },
                    { step: 2, title: 'Click "Academic Sessions" tab', description: 'Inside the Programs & Sessions section, click "Academic Sessions".' },
                    { step: 3, title: 'Fill Session Details', description: 'Enter: Session Name (e.g. "2024-2025"), Start Date, and End Date.' },
                    { step: 4, title: 'Create Session', description: 'Click "Create Session". It defaults to active status. Active sessions appear in student registration forms for batch assignment.' },
                    { step: 5, title: 'Edit or Deactivate a Session', description: 'Click the pencil icon on an existing session. You can update dates and toggle the "Is Active?" checkbox. Inactive sessions are hidden from student-facing forms.', tip: 'Keep only one session active at a time to avoid confusion in student forms.' },
                ],
            },
            {
                id: 'create-batch',
                title: 'Creating and Managing Batches',
                lastUpdated: '2026-02-27',
                summary: 'Create batches (sections) for programs and sessions.',
                steps: [
                    { step: 1, title: 'Go to Batches', description: 'Click "Batches" under the Academic group in the sidebar.' },
                    { step: 2, title: 'Fill Batch Form', description: 'Fill in: Batch Name (e.g. "Section A"), Program (select from dropdown), and Session (select from dropdown).' },
                    { step: 3, title: 'Create Batch', description: 'Click "Create". The batch appears as a card showing the student count.' },
                    { step: 4, title: 'Edit a Batch', description: 'Click the pencil icon on a batch card to edit its name, program, or session. Click Save.' },
                    { step: 5, title: 'Filter Batches', description: 'Use the Filter Program and Filter Session dropdowns above the batch grid to narrow down the view.', tip: 'Create distinct batches per program per year (e.g. "B.Pharm 2024 – Section A").' },
                ],
            },
            {
                id: 'create-subjects',
                title: 'Adding Subjects to Programs',
                lastUpdated: '2026-02-27',
                summary: 'Add subjects and link them to a program and semester.',
                steps: [
                    { step: 1, title: 'Go to Academic Config → Subjects tab', description: 'Click "Configuration" in the sidebar, then click the "Subjects" tab at the top of the page.' },
                    { step: 2, title: 'Select a Program', description: 'In the Add Subject form, select the program this subject belongs to from the Program dropdown.' },
                    { step: 3, title: 'Fill Subject Details', description: 'Enter: Subject Name, Subject Code, Semester (auto-populated based on program), Credits, and Type (Theory / Practical / Elective).' },
                    { step: 4, title: 'Create Subject', description: 'Click "Create Subject". It appears in the subject list on the right.' },
                    { step: 5, title: 'Edit a Subject', description: 'Click the pencil icon on any subject card to edit all fields inline. Click Save to update.' },
                    { step: 6, title: 'Filter Subjects', description: 'Use the Program and Semester dropdowns at the top of the subject list to filter by program or semester.', tip: 'Subjects are used by teachers for marks entry and exam result calculation.' },
                ],
            },
        ],
    },
    {
        id: 'finance',
        label: 'Finance & Fees',
        icon: '💰',
        articles: [
            {
                id: 'course-fee-management',
                title: 'Setting Course Pricing',
                lastUpdated: '2026-02-27',
                summary: 'Set and update base fees for courses using the Course Pricing module.',
                steps: [
                    { step: 1, title: 'Go to Course Pricing', description: 'Click "Course Pricing" under the Finance group in the sidebar.' },
                    { step: 2, title: 'Add a New Course Price', description: 'Click "+ Add Pricing". Fill in: Course Name, Original Price (in ₹), Offer Price (optional), Offer validity date, and available seats.' },
                    { step: 3, title: 'Activate Pricing', description: 'Toggle the Active switch to make the pricing visible on the public course pages and available for fee assignment.' },
                    { step: 4, title: 'Edit Existing Pricing', description: 'Click the edit icon on any pricing row to update prices. Changes to Original Price will propagate to all linked student fee records in the system.', warning: 'Changing the Original Price will recalculate final fees for all students linked to this course — their individual discount % will be preserved.' },
                ],
            },
            {
                id: 'bulk-fee-assignment',
                title: 'Bulk Fee Assignment to a Batch',
                lastUpdated: '2026-02-27',
                summary: 'Assign fee records to all students in a batch at once.',
                steps: [
                    { step: 1, title: 'Go to Fee Management', description: 'Click "Fee Management" under the Finance group in the sidebar.' },
                    { step: 2, title: 'Find the Course', description: 'The page shows all courses with their base fee, offer price, effective price, and the number of linked students.' },
                    { step: 3, title: 'Click "Assign"', description: 'Click the green "Assign" button on the course row. A modal appears.' },
                    { step: 4, title: 'Fill Assignment Form', description: 'In the modal, select: Batch (which batch to assign to), Academic Year (e.g. "2024-25"), Fee Label (e.g. "Annual Fee"), and optional Discount % for the entire batch.' },
                    { step: 5, title: 'Confirm Assignment', description: 'Click "Assign Fees". The system creates StudentFee records for all active students in the selected batch. Students already having a record for this course+year are skipped automatically.', tip: 'After bulk assignment, you can still edit individual student fees to apply custom discounts.' },
                ],
                relatedIds: ['manage-fees-student'],
            },
            {
                id: 'finance-dashboard',
                title: 'Reading the Finance Dashboard',
                lastUpdated: '2026-02-27',
                summary: 'Understand the finance dashboard metrics and charts.',
                steps: [
                    { step: 1, title: 'Open Finance Dashboard', description: 'Click "Finance Dashboard" under the Finance group in the sidebar.' },
                    { step: 2, title: 'Top Stats Row', description: 'Shows: Total Revenue (all fee payments ever recorded), Total Expenses, Total Salaries Paid, and Net Balance (Revenue − Expenses − Salaries).' },
                    { step: 3, title: 'Student Fee System Stats', description: 'Below the top row: Total Base Fee (sum of all base fees assigned), Total Discounts Given (₹ value of all discounts), Total Final Fee Billed, Total Collected (payments received), and Total Outstanding (still to collect).' },
                    { step: 4, title: 'Monthly Revenue Chart', description: 'A bar chart shows month-wise fee collection. Hover over any bar to see the exact amount for that month.' },
                    { step: 5, title: 'Expense & Salary Breakdown', description: 'Sub-pages at Finance → Expenses and Finance → Salary allow recording and viewing individual entries.' },
                ],
            },
        ],
    },
    {
        id: 'library-docs',
        label: 'Library & Documents',
        icon: '📚',
        articles: [
            {
                id: 'upload-library-doc',
                title: 'Uploading Library Documents',
                lastUpdated: '2026-02-27',
                summary: 'Add books, study materials, and resources to the digital library.',
                steps: [
                    { step: 1, title: 'Go to Library Docs', description: 'Click "Library Docs" under Library & Docs in the sidebar.' },
                    { step: 2, title: 'Click Add Document', description: 'Click the "+ Add Document" button. An upload form appears.' },
                    { step: 3, title: 'Fill Document Details', description: 'Enter: Title, Description, Category (select from existing or create new), and upload your file (PDF, DOCX, PPTX, XLSX, images).' },
                    { step: 4, title: 'Set Visibility', description: 'Choose whether the document is visible to all students, specific batches, or only admins.' },
                    { step: 5, title: 'Upload', description: 'Click Upload. The document becomes available in the library for all authorised users.', tip: 'The library supports PDFs, Word docs, PowerPoints, spreadsheets, images, and markdown files.' },
                ],
            },
            {
                id: 'manage-document-requests',
                title: 'Managing Admin Document Requests',
                lastUpdated: '2026-02-27',
                summary: 'Create document requirement slots and review student submissions.',
                steps: [
                    { step: 1, title: 'Go to Documents', description: 'Click "Documents" under Library & Docs in the sidebar.' },
                    { step: 2, title: 'Create a Document Request', description: 'Click "+ Create Request". Set: Title (e.g. "TC Certificate"), Description, whether a file upload is required, any custom form fields needed, and deadline.' },
                    { step: 3, title: 'Review Submissions', description: 'Click any document request row to see all student submissions. Each submission shows the student name, submission date, and uploaded file.' },
                    { step: 4, title: 'Download Submissions', description: 'Click the download icon next to any submission to download the student\'s uploaded file.' },
                    { step: 5, title: 'Mark as Reviewed', description: 'Click the "Mark Reviewed" button on a submission to flag it as processed.', tip: 'You can bulk-download or filter by batch to process all submissions efficiently.' },
                ],
            },
        ],
    },
    {
        id: 'communication',
        label: 'Communication',
        icon: '📢',
        articles: [
            {
                id: 'publish-notice',
                title: 'Publishing a Notice',
                lastUpdated: '2026-02-27',
                summary: 'Create and publish notices visible to students and teachers.',
                steps: [
                    { step: 1, title: 'Go to Notices', description: 'Click "Notices" under Communication in the sidebar.' },
                    { step: 2, title: 'Click Create Notice', description: 'Click the "+ Create" button. A form opens.' },
                    { step: 3, title: 'Fill Notice Details', description: 'Enter: Title, Content (rich-text supported), Category, and Priority (Normal / Important / Urgent).' },
                    { step: 4, title: 'Attach Files (Optional)', description: 'Click "Attach File" to attach PDFs, images, or documents. Students can download these from the notice.' },
                    { step: 5, title: 'Publish', description: 'Click Publish. The notice appears immediately on the student and teacher dashboards.', tip: 'Use "Important" priority for exam schedules and "Urgent" for time-sensitive announcements.' },
                ],
            },
            {
                id: 'scrolling-updates',
                title: 'Managing Scrolling Marquee Updates',
                lastUpdated: '2026-02-27',
                summary: 'Add or remove scrolling text banners shown across the public website.',
                steps: [
                    { step: 1, title: 'Go to Scrolling Updates', description: 'Click "Scrolling Updates" under Communication in the sidebar.' },
                    { step: 2, title: 'Add Update Text', description: 'Click "+ Add" and type the marquee text (e.g. "Admission Open for 2025-26 — Contact office").' },
                    { step: 3, title: 'Enable/Disable', description: 'Toggle the Active switch to show or hide each marquee item. Inactive items are stored but not displayed.' },
                    { step: 4, title: 'Delete', description: 'Click the trash icon to permanently remove a marquee entry.', tip: 'Keep marquee text concise — under 100 characters works best for readability.' },
                ],
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SOP DATA
// ─────────────────────────────────────────────────────────────────────────────

export const studentCategories: Category[] = [
    {
        id: 'getting-started',
        label: 'Getting Started',
        icon: '🚀',
        articles: [
            {
                id: 'student-register',
                title: 'How to Register as a Student',
                lastUpdated: '2026-02-27',
                summary: 'Create your student account and complete your registration with the college.',
                overview: [
                    'Registration is self-service — go to /register and fill the form.',
                    'After submitting, your status is "Pending" until the admin approves you.',
                    'You must upload documents (Photo, 10th, 12th, Aadhaar) after registering.',
                    'You cannot use ERP features until the admin activates your account.',
                ],
                flowDiagram: `flowchart TD
    A([Visit /register]) --> B[Fill personal details]
    B --> C[Set username + roll number]
    C --> D[Select Program + Session]
    D --> E[Click Register]
    E --> F[Account created — Status: Pending]
    F --> G[Upload Documents]
    G --> H[Admin Reviews]
    H --> I{Decision}
    I -- Approved --> J([Account Active ✓ — Login works])
    I -- Rejected --> K[See rejection reasons]
    K --> L[Fix and re-upload docs]
    L --> H`,
                steps: [
                    { step: 1, title: 'Go to the Registration Page', description: 'Open your browser and navigate to https://www.ldmcollege.com/register. You will see the student registration form.', note: 'You must use your own email address. One account per email is allowed.' },
                    { step: 2, title: 'Fill Personal Details', description: 'Enter: Full Name (as on your documents), Email Address, Mobile Number (10 digits, no country code), and a Password of at least 8 characters including a number.', detail: 'Your email becomes your login ID. Use a personal email you check regularly, not a college/shared email.' },
                    { step: 3, title: 'Set Username and Roll Number', description: 'Enter a unique username (only letters and numbers, no spaces). Enter your Roll Number if it has already been issued by the college.', tip: 'If your roll number has not been issued yet, leave that field blank — admin can add it later.' },
                    { step: 4, title: 'Select Your Program and Session', description: 'Choose your Program (e.g. B.Pharm, D.Pharm) from the dropdown. Then select the Academic Session (e.g. 2024-2025). These fields link your account to the correct batch.', warning: 'Selecting the wrong program or session will place you in the wrong batch. Double-check before submitting.' },
                    { step: 5, title: 'Submit Registration', description: 'Click the "Register" button. The system creates your account with a status of "Pending" and redirects you to your student dashboard where a status banner is visible.' },
                    { step: 6, title: 'Upload Your Documents', description: 'Without closing the browser, click "Profile & Docs" in the sidebar. Upload: Passport Photo (clear face photo, JPG/PNG), 10th Marksheet (PDF or image), 12th Marksheet (PDF or image), and Aadhaar Card (scan of both sides).', tip: 'Upload all documents immediately after registering. The admin needs them to approve your account.' },
                    { step: 7, title: 'Wait for Admin Approval', description: 'Check your dashboard daily. A status banner shows your current state: Pending / Under Review / Active / Rejected. Once set to Active, all ERP features unlock automatically.', note: 'Approval usually takes 1-3 working days. Contact the college office if you have been waiting longer than a week.' },
                ],
                relatedIds: ['upload-profile-docs', 'student-login'],
            },
            {
                id: 'student-login',
                title: 'How to Log In',
                lastUpdated: '2026-02-27',
                summary: 'Sign in to your student account.',
                steps: [
                    { step: 1, title: 'Go to Login Page', description: 'Navigate to /login. You will see the LDM sign-in form.' },
                    { step: 2, title: 'Enter Credentials', description: 'Enter your registered Email and Password. Or use the "Sign in with Google" button if you registered with Google OAuth.' },
                    { step: 3, title: 'Sign In', description: 'Click Sign In. You are redirected to your student dashboard at /student.' },
                    { step: 4, title: 'Troubleshooting', description: 'If login fails: (a) Check your email address is correct. (b) Use "Forgot Password" if available. (c) Contact admin if your account is blocked.', warning: 'Do not share your password with anyone.' },
                ],
            },
        ],
    },
    {
        id: 'profile-documents',
        label: 'Profile & Documents',
        icon: '📋',
        articles: [
            {
                id: 'upload-profile-docs',
                title: 'Uploading Required Documents',
                lastUpdated: '2026-02-27',
                summary: 'Upload your mandatory documents for admin review and approval.',
                steps: [
                    { step: 1, title: 'Go to Profile & Docs', description: 'Click "Profile & Docs" in the left sidebar. This opens your profile page.' },
                    { step: 2, title: 'Scroll to Documents Section', description: 'Below your personal details, you will see a "Documents" grid with mandatory document slots: Passport Photo, 10th Marksheet, 12th Marksheet, Aadhaar ID.' },
                    { step: 3, title: 'Upload Passport Photo', description: 'Click the "Upload" button under Passport Photo. Select a clear, recent photo (JPG or PNG). The photo must show your face clearly.', warning: 'Blurry or unclear photos will be rejected by the admin.' },
                    { step: 4, title: 'Upload Academic Documents', description: 'Upload your Class 10 and Class 12 marksheets as PDFs or images. Make sure all pages are visible and legible.' },
                    { step: 5, title: 'Upload Aadhaar ID', description: 'Upload a scanned copy of your Aadhaar card (front and back on one PDF if possible).' },
                    { step: 6, title: 'Upload Optional Documents', description: 'If Family ID is required, upload it in the Family ID slot. Custom document requests from admin will appear as additional slots.' },
                    { step: 7, title: 'Wait for Review', description: 'After uploading, the status shows "Pending Review". Admin will approve or reject with specific reasons.', tip: 'You can replace a rejected document by clicking Upload again on the same slot.' },
                ],
            },
            {
                id: 'edit-profile',
                title: 'Editing Your Profile Information',
                lastUpdated: '2026-02-27',
                summary: 'Update your contact information and personal details.',
                steps: [
                    { step: 1, title: 'Go to Profile & Docs', description: 'Click "Profile & Docs" in the sidebar.' },
                    { step: 2, title: 'Click Edit Profile', description: 'Click the "Edit Profile" button at the top of the page.' },
                    { step: 3, title: 'Update Fields', description: 'You can update: Mobile Number, Session From/To year, and any other editable fields shown.' },
                    { step: 4, title: 'Save Changes', description: 'Click "Save". Changes take effect immediately.', warning: 'Your email and username cannot be changed after registration. Contact admin for these changes.' },
                ],
            },
            {
                id: 'custom-document-submission',
                title: 'Submitting a Custom Document Request',
                lastUpdated: '2026-02-27',
                summary: 'Submit files or fill forms for admin-defined document requests.',
                steps: [
                    { step: 1, title: 'Go to My Documents', description: 'Click "My Documents" in the left sidebar.' },
                    { step: 2, title: 'View Open Requests', description: 'You will see all active document requests from the admin (e.g. "Migration Certificate", "TC Application Form"). Each shows the deadline and required format.' },
                    { step: 3, title: 'Click Submit', description: 'Click the "Submit" button on a request.' },
                    { step: 4, title: 'Fill Form Fields (if any)', description: 'Some requests require you to fill in custom form fields (e.g. "Reason for TC", "Previous Institution Name"). Fill all required fields.' },
                    { step: 5, title: 'Attach File (if required)', description: 'If the request requires a file upload, click "Attach File" and select your document.' },
                    { step: 6, title: 'Submit', description: 'Click Submit. Your submission is recorded and the admin is notified.', tip: 'You can re-submit before the deadline if you made a mistake.' },
                ],
            },
        ],
    },
    {
        id: 'fees',
        label: 'Fees & Payments',
        icon: '💳',
        articles: [
            {
                id: 'view-fees',
                title: 'Viewing Your Fee Records',
                lastUpdated: '2026-02-27',
                summary: 'Check your current fee status, including what you owe and what has been paid.',
                steps: [
                    { step: 1, title: 'Go to My Fees', description: 'Click "My Fees" in the left sidebar.' },
                    { step: 2, title: 'Understanding the Fee Cards', description: 'Each fee record shows: Fee Label (e.g. "Semester 1 Fee"), Academic Year, Base Fee, Discount %, Final Fee (what you owe after discount), Amount Paid, and Amount Remaining.' },
                    { step: 3, title: 'Payment History', description: 'Expand any fee record to see your complete payment history with dates and notes for each payment.' },
                    { step: 4, title: 'Progress Bar', description: 'A green progress bar shows what percentage of the final fee has been paid.', tip: 'If your fee record shows the wrong amount, contact the admin — they can adjust the base fee or discount.' },
                ],
            },
        ],
    },
    {
        id: 'academics',
        label: 'Academic Records',
        icon: '📊',
        articles: [
            {
                id: 'view-report-card',
                title: 'Viewing Your Report Card / Transcript',
                lastUpdated: '2026-02-27',
                summary: 'Access your semester-wise marks, GPA, and progression status.',
                steps: [
                    { step: 1, title: 'Go to Report Card', description: 'Click "Report Card" in the left sidebar.' },
                    { step: 2, title: 'Select Semester', description: 'Use the semester dropdown to choose which semester you want to view results for.' },
                    { step: 3, title: 'View Subject-wise Marks', description: 'A table shows all subjects with your marks, maximum marks, and pass/fail status for each.' },
                    { step: 4, title: 'View SGPA', description: 'Your Semester Grade Point Average (SGPA) and cumulative GPA are shown at the bottom of the card.' },
                    { step: 5, title: 'Download Transcript', description: 'Click "Download PDF" to save your transcript as a PDF file.', tip: 'Results are only visible after the admin or teacher has published them. If you see no results, they may not be released yet.' },
                ],
            },
        ],
    },
    {
        id: 'library',
        label: 'Library',
        icon: '📖',
        articles: [
            {
                id: 'browse-library',
                title: 'Browsing the Library',
                lastUpdated: '2026-02-27',
                summary: 'Find and read study materials in the digital library.',
                steps: [
                    { step: 1, title: 'Go to Library', description: 'Click "Library" in the left sidebar.' },
                    { step: 2, title: 'Browse by Category', description: 'Documents are organised into folders/categories. Click a category on the left to filter documents.' },
                    { step: 3, title: 'Search for a Document', description: 'Use the search bar at the top to find documents by title or keyword.' },
                    { step: 4, title: 'Open a Document', description: 'Click on any document card. PDFs open in an in-browser reader. Word docs and PPTs are downloadable.' },
                    { step: 5, title: 'Download', description: 'Click the Download button on any document to save it locally for offline study.', tip: 'The library is also available publicly at /library — no login required for public materials.' },
                ],
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER SOP DATA
// ─────────────────────────────────────────────────────────────────────────────

export const teacherCategories: Category[] = [
    {
        id: 'getting-started',
        label: 'Getting Started',
        icon: '🚀',
        articles: [
            {
                id: 'teacher-login',
                title: 'How to Log In as a Teacher',
                lastUpdated: '2026-02-27',
                summary: 'Sign in using your faculty credentials.',
                steps: [
                    { step: 1, title: 'Navigate to /login', description: 'Open your browser and go to the LDM login page at /login.' },
                    { step: 2, title: 'Enter Your Credentials', description: 'Use the email and password provided by the admin. Teacher accounts must be created by the admin — you cannot self-register.' },
                    { step: 3, title: 'Sign In', description: 'Click "Sign In". You are redirected to your teacher dashboard at /teacher.' },
                    { step: 4, title: 'Verify Dashboard', description: 'Your dashboard shows assigned batches, today\'s attendance status, pending assignments to review, and recent marks entries.', tip: 'If login fails, ask the admin to verify your account role is set to "teacher".' },
                ],
            },
            {
                id: 'teacher-dashboard-overview',
                title: 'Teacher Dashboard Overview',
                lastUpdated: '2026-02-27',
                summary: 'Understand the key information on your teacher dashboard.',
                steps: [
                    { step: 1, title: 'Dashboard Stats', description: 'The top row shows: Total Students assigned, Attendance pending today, Assignments awaiting review, and Marks to enter.' },
                    { step: 2, title: 'Sidebar Navigation', description: 'The left sidebar has: Dashboard, Attendance, Marks Entry, and Assignments.' },
                    { step: 3, title: 'Notices', description: 'Important admin notices appear on your dashboard. Click any notice to read the full content.' },
                ],
            },
        ],
    },
    {
        id: 'attendance',
        label: 'Attendance Management',
        icon: '✅',
        articles: [
            {
                id: 'mark-attendance',
                title: 'Marking Student Attendance',
                lastUpdated: '2026-02-27',
                summary: 'Record daily attendance for your batch.',
                overview: [
                    'You must mark attendance separately for each batch you teach.',
                    'Attendance defaults to today — you can change the date in the dropdown.',
                    'Past attendance records cannot be edited. Contact admin for corrections.',
                    'Students can see their own attendance from their dashboard.',
                ],
                flowDiagram: `flowchart TD
    A([Go to Attendance]) --> B[Select Batch]
    B --> C[Confirm or change Date]
    C --> D[Student list loads]
    D --> E[Mark each student: Present / Absent / Late]
    E --> F[Click Save Attendance]
    F --> G{All students marked?}
    G -- Yes --> H([Records saved ✓])
    G -- No --> I[Warning: unmarked students]
    I --> E`,
                steps: [
                    { step: 1, title: 'Go to the Attendance Page', description: 'Click "Attendance" in the left sidebar. The attendance marking interface loads.' },
                    { step: 2, title: 'Select Your Batch', description: 'Use the Batch dropdown at the top to select the class/section you want to mark attendance for. Only batches assigned to your account appear here.', note: 'If a batch is missing, ask the admin to assign it to your teacher account.' },
                    { step: 3, title: 'Confirm the Date', description: 'The date picker defaults to today. If you are marking for a previous session (allowed only for today), change it using the date input. Click the calendar icon to open the date picker.', warning: 'You can only mark or edit attendance for today. Past records are locked. Contact the admin to correct historical errors.' },
                    { step: 4, title: 'Mark Each Student', description: 'The student list shows every enrolled student in the batch. For each student, click one of: ✅ Present, ❌ Absent, or ⏰ Late. The selected button is highlighted. You must mark every student before saving.', tip: 'Use "Mark All Present" at the top to quickly mark everyone present, then individually change the absent/late students.' },
                    { step: 5, title: 'Save the Attendance', description: 'Once all students are marked, click the blue "Save Attendance" button at the bottom. A confirmation toast appears: "Attendance saved successfully".', detail: 'The saved records are immediately visible to: (a) each student in their attendance section, (b) the admin in the Finance/Academic reports.' },
                    { step: 6, title: 'Verify the Summary', description: 'After saving, a summary panel shows: Total Students, Present count, Absent count, Late count, and the Attendance % for that session.', tip: 'Screenshot the summary for your personal records before navigating away.' },
                ],
            },
            {
                id: 'view-attendance-report',
                title: 'Viewing Attendance Reports',
                lastUpdated: '2026-02-27',
                summary: 'Check attendance history and percentage for a batch.',
                steps: [
                    { step: 1, title: 'Go to Attendance', description: 'Click "Attendance" in the sidebar.' },
                    { step: 2, title: 'Click View Report', description: 'Click the "View Report" or "History" tab to switch from marking mode to report mode.' },
                    { step: 3, title: 'Filter by Date Range', description: 'Select a start and end date to view attendance within a specific period.' },
                    { step: 4, title: 'Student-wise Summary', description: 'The report shows each student\'s total present days, total absent days, and attendance percentage.' },
                ],
            },
        ],
    },
    {
        id: 'marks',
        label: 'Marks Entry',
        icon: '📝',
        articles: [
            {
                id: 'enter-marks',
                title: 'Entering Marks for a Semester Exam',
                lastUpdated: '2026-02-27',
                summary: 'Enter marks for students in each subject after exams.',
                steps: [
                    { step: 1, title: 'Go to Marks Entry', description: 'Click "Marks Entry" in the sidebar.' },
                    { step: 2, title: 'Select the Exam', description: 'Choose the exam from the list (e.g. "End Semester Exam – Semester 3"). The exam must be created by the admin first.' },
                    { step: 3, title: 'Select Batch and Subject', description: 'Choose the batch and subject you want to enter marks for.' },
                    { step: 4, title: 'Enter Marks for Each Student', description: 'A table shows all students. Enter marks obtained in the input field for each student.' },
                    { step: 5, title: 'Save Marks', description: 'Click "Save Marks". Results are stored and can be processed by the admin for GPA calculation.', warning: 'Double-check all marks before saving. Incorrect marks affect SGPA and progression status.' },
                ],
            },
        ],
    },
    {
        id: 'assignments',
        label: 'Assignments & Documents',
        icon: '📂',
        articles: [
            {
                id: 'create-assignment',
                title: 'Creating and Publishing an Assignment',
                lastUpdated: '2026-02-27',
                summary: 'Create new assignments for students to complete and submit.',
                steps: [
                    { step: 1, title: 'Go to Assignments', description: 'Click "Assignments" in the sidebar.' },
                    { step: 2, title: 'Click Create Assignment', description: 'Click the "+ Create" button. A form opens.' },
                    { step: 3, title: 'Fill Assignment Details', description: 'Enter: Title, Description/Instructions, Subject, Batch, and Submission Deadline.' },
                    { step: 4, title: 'Attach Reference Files (Optional)', description: 'Attach any reference PDFs or files students should read before completing the assignment.' },
                    { step: 5, title: 'Publish', description: 'Click "Publish". The assignment is visible to all students in the selected batch immediately.' },
                ],
            },
            {
                id: 'review-submissions',
                title: 'Reviewing Student Assignment Submissions',
                lastUpdated: '2026-02-27',
                summary: 'View and grade student submissions for published assignments.',
                steps: [
                    { step: 1, title: 'Go to Assignments', description: 'Click "Assignments" in the sidebar.' },
                    { step: 2, title: 'Open an Assignment', description: 'Click an assignment from the list to open it.' },
                    { step: 3, title: 'View Submissions', description: 'Click the "Submissions" tab. Each student submission shows the student name, submit time, and attached file.' },
                    { step: 4, title: 'Download and Review', description: 'Click the download icon to download a student\'s submission file. Review it offline.' },
                    { step: 5, title: 'Mark as Reviewed', description: 'Click "Mark Reviewed" to flag the submission as graded/reviewed.', tip: 'Submissions after the deadline are still accepted — the system marks them as "Late".' },
                ],
            },
        ],
    },
];

// Combined search index
export type SearchResult = {
    role: 'admin' | 'student' | 'teacher';
    categoryId: string;
    categoryLabel: string;
    article: Article;
};

export function buildSearchIndex(role: 'admin' | 'student' | 'teacher'): SearchResult[] {
    const cats = role === 'admin' ? adminCategories : role === 'student' ? studentCategories : teacherCategories;
    const results: SearchResult[] = [];
    for (const cat of cats) {
        for (const article of cat.articles) {
            results.push({ role, categoryId: cat.id, categoryLabel: cat.label, article });
        }
    }
    return results;
}
