// Last Updated: 2026-02-27

export type Step = {
    step: number;
    title: string;
    description: string;
    tip?: string;
    warning?: string;
};

export type Article = {
    id: string;
    title: string;
    lastUpdated: string;
    summary: string;
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
                steps: [
                    { step: 1, title: 'Go to the Login Page', description: 'Navigate to /login in your browser. You will see the LDM College login screen with email and password fields.' },
                    { step: 2, title: 'Enter Admin Credentials', description: 'Type your registered admin email address and password. Admin accounts are created by the system owner — they cannot self-register.', tip: 'If you forgot your password, contact the system owner to reset it in the database.' },
                    { step: 3, title: 'Click Sign In', description: 'Click the "Sign In" button. If credentials are correct, you will be redirected to /admin (the admin dashboard).' },
                    { step: 4, title: 'Verify Dashboard Loads', description: 'The admin dashboard shows total students, revenue, pending approvals, and recent activity. If it loads, you are successfully logged in.', tip: 'Bookmark /admin for quick access.' },
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
                steps: [
                    { step: 1, title: 'Open Students Page', description: 'Click "Students" in the sidebar (under the People group). You will see a searchable, filterable list of all students.' },
                    { step: 2, title: 'Filter Pending Students', description: 'Use the Status filter dropdown and select "Pending". This shows only students awaiting approval.' },
                    { step: 3, title: 'Click on a Student Row', description: 'Click the eye icon or the student row to open their detail modal. You can view their profile, uploaded documents, and submitted information.' },
                    { step: 4, title: 'Review Documents Tab', description: 'Switch to the "Documents" tab inside the student modal. Verify that passport photo, 10th marksheet, 12th marksheet, and Aadhaar are uploaded correctly.' },
                    { step: 5, title: 'Approve or Reject', description: 'Inside the modal, go to the "Edit" tab. Set the Status field to "approved" and click Save. Or set to "rejected" and provide a rejection reason.', warning: 'Rejected students will receive a notification and can re-submit. Verify all documents before rejecting.' },
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
                steps: [
                    { step: 1, title: 'Open Student Modal', description: 'Go to Admin → Students, find the student, and click their row to open the detail modal.' },
                    { step: 2, title: 'Switch to Fees Tab', description: 'Click the "Fees" tab inside the modal.' },
                    { step: 3, title: 'Add a Fee Record', description: 'At the top of the Fees tab, fill in: Fee Label (e.g. "Semester 1"), Academic Year (e.g. "2024-25"), Base Fee (₹ amount from course pricing), and Discount % (0 for no discount). The system automatically shows the computed Final Fee preview.' },
                    { step: 4, title: 'Click Add', description: 'Click the blue Add button. The new fee record appears in the list below with 5 chips: Base | Disc% | Final | Paid | Left.' },
                    { step: 5, title: 'Edit an Existing Fee Record', description: 'Click the grey "Edit" button on any fee record. An inline form appears allowing you to change Base Fee, Discount %, or Final Fee directly. Set either Discount % or Final Fee — the system calculates the other automatically.' },
                    { step: 6, title: 'Record a Payment', description: 'Click the green "+ Payment" button on a fee record. Enter the amount and an optional note (e.g. "Cash payment"). Click Save. The Paid and Left amounts update instantly.' },
                    { step: 7, title: 'Delete a Fee Record', description: 'Click the red trash icon on a fee record to permanently delete it along with all its payment history.', warning: 'Deletion cannot be undone. Make sure you are removing the correct record.' },
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
                steps: [
                    { step: 1, title: 'Go to the Registration Page', description: 'Open your browser and go to /register. You will see a student registration form.' },
                    { step: 2, title: 'Fill Personal Details', description: 'Enter: Full Name, Email Address, Mobile Number, and choose a Password (minimum 8 characters).' },
                    { step: 3, title: 'Set Username & Roll Number', description: 'Enter a unique username (letters and numbers only) and your Roll Number if already issued.' },
                    { step: 4, title: 'Select Program & Batch', description: 'Choose your Program (e.g. B.Pharm) and Academic Session from the dropdown. This links you to your batch.' },
                    { step: 5, title: 'Submit Registration', description: 'Click "Register". Your account is created with "Pending" status. You will be redirected to your dashboard.' },
                    { step: 6, title: 'Wait for Admin Approval', description: 'An admin will review your registration and documents. You will see a banner on your dashboard showing your current status.', tip: 'You can log in any time to check your approval status and upload required documents.' },
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
                steps: [
                    { step: 1, title: 'Go to Attendance', description: 'Click "Attendance" in the sidebar.' },
                    { step: 2, title: 'Select Batch and Date', description: 'Choose the Batch from the dropdown and confirm or change the date (defaults to today).' },
                    { step: 3, title: 'Mark Each Student', description: 'A list of all students in the batch appears. Click "Present" or "Absent" for each student. You can also mark as "Late".' },
                    { step: 4, title: 'Save Attendance', description: 'Click "Save Attendance". The records are saved and visible to the admin and each student.', warning: 'You can edit today\'s attendance but not past records. Contact admin for corrections.' },
                    { step: 5, title: 'View Attendance Summary', description: 'The summary at the bottom shows the count of Present, Absent, and Late for today\'s session.', tip: 'Mark attendance as early as possible to ensure accurate records.' },
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
