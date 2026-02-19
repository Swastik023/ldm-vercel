/**
 * seed_finance.js
 * Seeds realistic Finance data: FeeStructures, FeePayments, Expenses, Salaries
 * Run:  node scripts/seed_finance.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ── IDs from DB (fetched 2024-02-19) ─────────────────────────────────────────
const SESSION_ID = '69974c26cee1c378aabf84c3'; // 2024–2025

const PROGRAMS = [
    { id: '69974c27cee1c378aabf84c5', code: 'DCCM', name: 'Diploma in Critical Care Management', semesters: 2, fee_per_sem: 35000 },
    { id: '69974c27cee1c378aabf84d5', code: 'DHM', name: 'Diploma in Hospital Management', semesters: 2, fee_per_sem: 28000 },
    { id: '69974c27cee1c378aabf84e5', code: 'DAT', name: 'Diploma in Anaesthesia Technology', semesters: 5, fee_per_sem: 40000 },
    { id: '69974c28cee1c378aabf84f5', code: 'DCP', name: 'Diploma in Community Care Provider', semesters: 2, fee_per_sem: 22000 },
    { id: '69974c28cee1c378aabf8505', code: 'DETC', name: 'Diploma in Emergency & Trauma Care', semesters: 2, fee_per_sem: 32000 },
    { id: '69974c28cee1c378aabf8515', code: 'DHSI', name: 'Diploma in Health & Sanitary Inspector', semesters: 2, fee_per_sem: 25000 },
    { id: '69974c29cee1c378aabf8525', code: 'DHCP', name: 'Diploma in Home Care Provider', semesters: 2, fee_per_sem: 20000 },
    { id: '69974c29cee1c378aabf8535', code: 'DHA', name: 'Diploma in Hospital Administration', semesters: 2, fee_per_sem: 30000 },
    { id: '69974c2acee1c378aabf8545', code: 'DHWM', name: 'Diploma in Hospital Waste Management', semesters: 2, fee_per_sem: 23000 },
    { id: '69974c2acee1c378aabf8555', code: 'DMLT', name: 'Diploma in Medical Laboratory Technology', semesters: 5, fee_per_sem: 38000 },
    { id: '69974c2acee1c378aabf8565', code: 'DNT', name: 'Diploma in Nanny Training', semesters: 2, fee_per_sem: 18000 },
    { id: '69974c2bcee1c378aabf8575', code: 'DOTT', name: 'Diploma in Operation Theatre Technology', semesters: 5, fee_per_sem: 42000 },
    { id: '69974c2bcee1c378aabf8585', code: 'DP', name: 'Diploma in Panchkarma', semesters: 2, fee_per_sem: 27000 },
    { id: '69974c2ccee1c378aabf8595', code: 'DRIT', name: 'Diploma in Radiology & Imaging Technology', semesters: 5, fee_per_sem: 45000 },
    { id: '69974c2ccee1c378aabf85a5', code: 'MPHW', name: 'Multipurpose Health Worker', semesters: 4, fee_per_sem: 26000 },
    { id: '69974c2ccee1c378aabf85b5', code: 'CAIM', name: 'Certificate in Ayurveda Infertility Management', semesters: 1, fee_per_sem: 15000 },
    { id: '69974c2dcee1c378aabf85c5', code: 'CAND', name: 'Certificate in Ayurveda Nutrition & Dietetics', semesters: 1, fee_per_sem: 12000 },
    { id: '69974c2dcee1c378aabf85d5', code: 'CAP', name: 'Certificate in Ayurveda Parasurgery', semesters: 2, fee_per_sem: 18000 },
    { id: '69974c2dcee1c378aabf85e5', code: 'CACSBC', name: 'Certificate in Ayurvedic Cosmetology', semesters: 1, fee_per_sem: 14000 },
];

const ADMIN_ID = '69974c26cee1c378aabf84b9';
const TEACHERS = [
    { id: '69974c26cee1c378aabf84bb', name: 'Dr. Rajesh Sachdeva', base: 75000, deductions: 7500 },
    { id: '69974c26cee1c378aabf84bd', name: 'Dr. Sakshi Sachdeva', base: 70000, deductions: 7000 },
    { id: '69974c26cee1c378aabf84bf', name: 'Dr. Saurabh Sachdeva', base: 65000, deductions: 6500 },
];

const STUDENTS = [
    { id: '69974c26cee1c378aabf84c1', name: 'Demo Student', programIdx: 0 }, // DCCM
    { id: '69975bf7ceca44dbad354e93', name: 'Swastik', programIdx: 9 }, // DMLT
];

// ── Schemas ───────────────────────────────────────────────────────────────────
const FeeStructureSchema = new mongoose.Schema({
    program: mongoose.Schema.Types.ObjectId,
    session: mongoose.Schema.Types.ObjectId,
    semester: Number,
    total_amount: Number,
    due_date: Date,
    description: String,
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

const PaymentTransactionSchema = new mongoose.Schema({
    amount: Number,
    paid_on: Date,
    mode: { type: String, enum: ['cash', 'online', 'cheque', 'dd'] },
    receipt_no: String,
    remarks: String,
    recorded_by: mongoose.Schema.Types.ObjectId,
}, { _id: false });

const FeePaymentSchema = new mongoose.Schema({
    student: mongoose.Schema.Types.ObjectId,
    fee_structure: mongoose.Schema.Types.ObjectId,
    amount_paid: { type: Number, default: 0 },
    payments: [PaymentTransactionSchema],
    status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
}, { timestamps: true });

const ExpenseSchema = new mongoose.Schema({
    title: String,
    amount: Number,
    category: { type: String, enum: ['infrastructure', 'utilities', 'supplies', 'salaries', 'marketing', 'events', 'maintenance', 'other'] },
    date_paid: Date,
    recipient: String,
    remarks: String,
}, { timestamps: true });

const SalarySchema = new mongoose.Schema({
    employee: mongoose.Schema.Types.ObjectId,
    month: String,
    base_amount: Number,
    deductions: Number,
    net_amount: Number,
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paid_on: Date,
    paid_by: mongoose.Schema.Types.ObjectId,
    remarks: String,
}, { timestamps: true });
SalarySchema.index({ employee: 1, month: 1 }, { unique: true });

const FeeStructure = mongoose.models.FeeStructure || mongoose.model('FeeStructure', FeeStructureSchema);
const FeePayment = mongoose.models.FeePayment || mongoose.model('FeePayment', FeePaymentSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
const Salary = mongoose.models.Salary || mongoose.model('Salary', SalarySchema);

// ── Helpers ───────────────────────────────────────────────────────────────────
function d(y, m, day) { return new Date(y, m - 1, day); }
function rcpt(prefix, n) { return `${prefix}-${String(n).padStart(4, '0')}`; }

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing finance data
    await FeeStructure.deleteMany({});
    await FeePayment.deleteMany({});
    await Expense.deleteMany({});
    await Salary.deleteMany({});
    console.log('🗑  Cleared existing finance data\n');

    // ── 1. FEE STRUCTURES (one per semester per program) ──────────────────────
    console.log('📋 Creating Fee Structures...');
    const feeStructureMap = {}; // programId -> [fsId per sem]

    for (const prog of PROGRAMS) {
        feeStructureMap[prog.id] = [];
        for (let sem = 1; sem <= prog.semesters; sem++) {
            // Due date: odd sems = July 15, even sems = January 15
            const dueDate = sem % 2 === 1 ? d(2024, 7, 15) : d(2025, 1, 15);
            const fs = await FeeStructure.create({
                program: new mongoose.Types.ObjectId(prog.id),
                session: new mongoose.Types.ObjectId(SESSION_ID),
                semester: sem,
                total_amount: prog.fee_per_sem,
                due_date: dueDate,
                description: `Semester ${sem} fees for ${prog.name} (2024–25)`,
                is_active: true,
            });
            feeStructureMap[prog.id].push(fs._id);
        }
        console.log(`  ✓ ${prog.code} — ${prog.semesters} semester(s) @ ₹${prog.fee_per_sem.toLocaleString('en-IN')} each`);
    }

    // ── 2. FEE PAYMENTS for students ─────────────────────────────────────────
    console.log('\n💳 Creating Fee Payments...');
    for (const stu of STUDENTS) {
        const prog = PROGRAMS[stu.programIdx];
        const fsIds = feeStructureMap[prog.id];

        for (let i = 0; i < fsIds.length; i++) {
            const sem = i + 1;
            const total = prog.fee_per_sem;
            // Sem 1: fully paid | Sem 2: partial | Sem 3+: unpaid
            let amountPaid = 0, payments = [], status = 'unpaid';

            if (sem === 1) {
                // Full payment in two installments
                const inst1 = Math.round(total * 0.6);
                const inst2 = total - inst1;
                payments = [
                    { amount: inst1, paid_on: d(2024, 7, 20), mode: 'online', receipt_no: rcpt(prog.code + sem, i * 10 + 1), remarks: 'First installment', recorded_by: new mongoose.Types.ObjectId(ADMIN_ID) },
                    { amount: inst2, paid_on: d(2024, 8, 10), mode: 'cash', receipt_no: rcpt(prog.code + sem, i * 10 + 2), remarks: 'Second installment', recorded_by: new mongoose.Types.ObjectId(ADMIN_ID) },
                ];
                amountPaid = total;
                status = 'paid';
            } else if (sem === 2) {
                // Partial — paid 60%
                const partial = Math.round(total * 0.6);
                payments = [
                    { amount: partial, paid_on: d(2025, 1, 20), mode: 'cheque', receipt_no: rcpt(prog.code + sem, i * 10 + 3), remarks: 'Partial payment', recorded_by: new mongoose.Types.ObjectId(ADMIN_ID) },
                ];
                amountPaid = partial;
                status = 'partial';
            }
            // sem 3+ → unpaid (no payments)

            await FeePayment.create({
                student: new mongoose.Types.ObjectId(stu.id),
                fee_structure: fsIds[i],
                amount_paid: amountPaid,
                payments,
                status,
            });
        }
        console.log(`  ✓ ${stu.name} — ${prog.code} (${fsIds.length} semester records)`);
    }

    // ── 3. EXPENSES (last 6 months) ───────────────────────────────────────────
    console.log('\n💸 Creating Expenses...');
    const expenses = [
        // September 2024
        { title: 'Lab Equipment Purchase', amount: 85000, category: 'supplies', date_paid: d(2024, 9, 5), recipient: 'MedEquip India Pvt. Ltd.', remarks: 'New microscopes and diagnostic kits for DMLT lab' },
        { title: 'Electricity Bill — Sep 2024', amount: 18500, category: 'utilities', date_paid: d(2024, 9, 8), recipient: 'UPCL', remarks: 'Monthly electricity charges' },
        { title: 'Internet & Broadband', amount: 4500, category: 'utilities', date_paid: d(2024, 9, 10), recipient: 'Airtel Business', remarks: 'Monthly internet bill' },
        { title: 'Building Maintenance', amount: 32000, category: 'maintenance', date_paid: d(2024, 9, 15), recipient: 'SK Contractors', remarks: 'Roof repair and painting' },
        { title: 'Stationery & Printing', amount: 8200, category: 'supplies', date_paid: d(2024, 9, 18), recipient: 'Ravi General Stores', remarks: 'Admit cards, forms, registers' },
        // October 2024
        { title: 'Electricity Bill — Oct 2024', amount: 17200, category: 'utilities', date_paid: d(2024, 10, 7), recipient: 'UPCL', remarks: 'Monthly electricity charges' },
        { title: 'Annual Day Event', amount: 45000, category: 'events', date_paid: d(2024, 10, 12), recipient: 'Sunrise Event Planners', remarks: 'Annual function decoration, audio, catering' },
        { title: 'Medical Supplies for OPD', amount: 22000, category: 'supplies', date_paid: d(2024, 10, 20), recipient: 'MedLife Pharmaceuticals', remarks: 'Monthly OPD consumables' },
        { title: 'College Prospectus Printing', amount: 15000, category: 'marketing', date_paid: d(2024, 10, 25), recipient: 'City Print Press', remarks: '1000 copies for admissions 2025' },
        // November 2024
        { title: 'Electricity Bill — Nov 2024', amount: 16800, category: 'utilities', date_paid: d(2024, 11, 6), recipient: 'UPCL', remarks: 'Monthly electricity charges' },
        { title: 'Furniture Purchase', amount: 38000, category: 'infrastructure', date_paid: d(2024, 11, 10), recipient: 'Woodcraft Interiors', remarks: '10 study tables and 30 chairs for classroom 3' },
        { title: 'CCTV Installation', amount: 28500, category: 'infrastructure', date_paid: d(2024, 11, 18), recipient: 'SecureVision Tech', remarks: '8 cameras installed in corridors and labs' },
        { title: 'Internet & Broadband', amount: 4500, category: 'utilities', date_paid: d(2024, 11, 10), recipient: 'Airtel Business', remarks: 'Monthly internet bill' },
        // December 2024
        { title: 'Electricity Bill — Dec 2024', amount: 19500, category: 'utilities', date_paid: d(2024, 12, 5), recipient: 'UPCL', remarks: 'Monthly electricity charges' },
        { title: 'Convocation Ceremony', amount: 55000, category: 'events', date_paid: d(2024, 12, 8), recipient: 'Royal Banquet Hall', remarks: 'Venue, certificates, gowns for 2024 batch' },
        { title: 'Library Books', amount: 42000, category: 'supplies', date_paid: d(2024, 12, 15), recipient: 'Jaypee Brothers Medical Pub.', remarks: 'New medical and paramedical textbooks' },
        { title: 'Generator Servicing', amount: 12000, category: 'maintenance', date_paid: d(2024, 12, 20), recipient: 'PowerGen Services', remarks: 'Annual DG set overhauling' },
        { title: 'Website Hosting & Domain', amount: 6800, category: 'other', date_paid: d(2024, 12, 28), recipient: 'GoDaddy / Vercel', remarks: 'Annual renewal' },
        // January 2025
        { title: 'Electricity Bill — Jan 2025', amount: 20100, category: 'utilities', date_paid: d(2025, 1, 7), recipient: 'UPCL', remarks: 'Monthly electricity charges' },
        { title: 'Admission Campaign — Google', amount: 18000, category: 'marketing', date_paid: d(2025, 1, 12), recipient: 'Google Ads', remarks: 'Online ads for 2025 admissions' },
        { title: 'Lab Chemical Refill', amount: 14500, category: 'supplies', date_paid: d(2025, 1, 18), recipient: 'LabChem India', remarks: 'Reagents, stains, buffers for pathology lab' },
        { title: 'Drinking Water Supply', amount: 3600, category: 'utilities', date_paid: d(2025, 1, 20), recipient: 'Aquapur Water Solutions', remarks: 'Monthly 20L jar supplies' },
        { title: 'Internet & Broadband', amount: 4500, category: 'utilities', date_paid: d(2025, 1, 10), recipient: 'Airtel Business', remarks: 'Monthly internet bill' },
        // February 2025
        { title: 'Electricity Bill — Feb 2025', amount: 15800, category: 'utilities', date_paid: d(2025, 2, 6), recipient: 'UPCL', remarks: 'Monthly electricity charges' },
        { title: 'First Aid Workshop', amount: 9500, category: 'events', date_paid: d(2025, 2, 14), recipient: 'Red Cross Society', remarks: 'BLS & first-aid training for 50 students' },
        { title: 'Projector & Screen', amount: 34000, category: 'infrastructure', date_paid: d(2025, 2, 18), recipient: 'Sony Multimedia Center', remarks: 'Smart projector for seminar hall' },
    ];

    for (const exp of expenses) {
        await Expense.create(exp);
    }
    console.log(`  ✓ ${expenses.length} expense records created`);

    // ── 4. SALARIES (Sep 2024 – Feb 2025) ────────────────────────────────────
    console.log('\n💰 Creating Salaries...');
    const months = [
        { m: '2024-09', label: 'Sep 2024', paid: true, paidOn: d(2024, 9, 30) },
        { m: '2024-10', label: 'Oct 2024', paid: true, paidOn: d(2024, 10, 31) },
        { m: '2024-11', label: 'Nov 2024', paid: true, paidOn: d(2024, 11, 30) },
        { m: '2024-12', label: 'Dec 2024', paid: true, paidOn: d(2024, 12, 31) },
        { m: '2025-01', label: 'Jan 2025', paid: true, paidOn: d(2025, 1, 31) },
        { m: '2025-02', label: 'Feb 2025', paid: false, paidOn: null },
    ];

    for (const t of TEACHERS) {
        for (const mo of months) {
            await Salary.create({
                employee: new mongoose.Types.ObjectId(t.id),
                month: mo.m,
                base_amount: t.base,
                deductions: t.deductions,
                net_amount: t.base - t.deductions,
                status: mo.paid ? 'paid' : 'pending',
                paid_on: mo.paid ? mo.paidOn : null,
                paid_by: mo.paid ? new mongoose.Types.ObjectId(ADMIN_ID) : null,
                remarks: mo.paid ? 'Salary disbursed via bank transfer' : '',
            });
        }
        console.log(`  ✓ ${t.name} — 6 months (₹${t.base.toLocaleString('en-IN')} base)`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const totalFeeStructures = await FeeStructure.countDocuments();
    const totalPayments = await FeePayment.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    const totalSalaries = await Salary.countDocuments();

    const totalRevenue = await FeePayment.aggregate([{ $group: { _id: null, sum: { $sum: '$amount_paid' } } }]);
    const totalExpAmt = await Expense.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
    const pendingSal = await Salary.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, sum: { $sum: '$net_amount' } } }]);

    console.log('\n═══════════════════════════════════════');
    console.log('  Finance Seed Summary');
    console.log('═══════════════════════════════════════');
    console.log(`  Fee Structures : ${totalFeeStructures}`);
    console.log(`  Fee Payments   : ${totalPayments}`);
    console.log(`  Expenses       : ${totalExpenses}`);
    console.log(`  Salaries       : ${totalSalaries}`);
    console.log('───────────────────────────────────────');
    console.log(`  Total Revenue  : ₹${(totalRevenue[0]?.sum || 0).toLocaleString('en-IN')}`);
    console.log(`  Total Expenses : ₹${(totalExpAmt[0]?.sum || 0).toLocaleString('en-IN')}`);
    console.log(`  Pending Salary : ₹${(pendingSal[0]?.sum || 0).toLocaleString('en-IN')}`);
    console.log('═══════════════════════════════════════\n');
    console.log('✅ Finance seed complete!');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => { console.error('Fatal:', err); process.exit(1); });
