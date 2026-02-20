import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeeStructure } from '@/models/FeeStructure';
import { FeePayment } from '@/models/FeePayment';
import { User } from '@/models/User';
import { Batch } from '@/models/Academic';
import '@/models/Academic'; // registers Program & Session for populate()

// GET /api/admin/finance/fee-structures — list all
export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const structures = await FeeStructure.find({ is_active: true })
        .populate('program', 'name code')
        .populate('session', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, structures });
}

// POST /api/admin/finance/fee-structures — create new
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { program, session: sessionId, semester, total_amount, due_date, description } = body;

    if (!program || !sessionId || !semester || !total_amount || !due_date) {
        return NextResponse.json({ success: false, message: 'All required fields must be provided' }, { status: 400 });
    }

    if (total_amount <= 0) {
        return NextResponse.json({ success: false, message: 'Total amount must be greater than 0' }, { status: 400 });
    }

    await dbConnect();
    const structure = await FeeStructure.create({
        program, session: sessionId, semester, total_amount, due_date, description,
    });

    // Auto-generate unpaid FeePayment records for all students in this program and session
    // 1. Find all active batches for this program and session
    const batches = await Batch.find({ program, session: sessionId, is_active: true }).select('_id').lean();
    const batchIds = batches.map(b => b._id);

    if (batchIds.length > 0) {
        // 2. Find all active students in these batches
        const students = await User.find({
            role: 'student',
            status: 'active',
            batch: { $in: batchIds }
        }).select('_id').lean();

        // 3. Create FeePayment records
        if (students.length > 0) {
            const feePayments = students.map(student => ({
                student: student._id,
                fee_structure: structure._id,
                amount_paid: 0,
                payments: [],
                status: 'unpaid'
            }));

            try {
                await FeePayment.insertMany(feePayments, { ordered: false });
                console.log(`Auto-generated ${feePayments.length} FeePayment records for FeeStructure ${structure._id}`);
            } catch (err) {
                console.error("Error auto-generating FeePayments:", err);
                // Continue even if some fail (e.g. unique constraint), but this is initial creation so it shouldn't
            }
        }
    }

    return NextResponse.json({ success: true, structure }, { status: 201 });
}
