import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeeRecord } from '@/models/FeeRecord';
import { calcFees } from '@/lib/feeCalculator';
import { User } from '@/models/User';

// GET /api/admin/finance/fee-records — list with optional filters
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const course = searchParams.get('course');
    const status = searchParams.get('status'); // 'paid' | 'partial' | 'unpaid'

    const query: Record<string, unknown> = {};
    if (course) query.course = { $regex: course, $options: 'i' };
    if (status === 'paid') query.remainingAmount = 0;
    else if (status === 'unpaid') query.amountPaid = 0;
    else if (status === 'partial') query.$and = [{ amountPaid: { $gt: 0 } }, { remainingAmount: { $gt: 0 } }];

    const records = await FeeRecord.find(query).sort({ createdAt: -1 }).lean();

    // Summary stats
    const totalRevenue = records.reduce((s, r) => s + r.amountPaid, 0);
    const totalDues = records.reduce((s, r) => s + r.remainingAmount, 0);

    return NextResponse.json({ success: true, records, totalRevenue, totalDues });
}

// POST /api/admin/finance/fee-records — create new fee record
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const body = await req.json();
    const { studentId, course, baseCoursePrice, discountPercent, flatDiscount, globalOfferApplied } = body;

    if (!studentId || !course || !baseCoursePrice) {
        return NextResponse.json({ success: false, message: 'studentId, course, and baseCoursePrice are required.' }, { status: 400 });
    }
    if (baseCoursePrice < 0) return NextResponse.json({ success: false, message: 'Base price cannot be negative.' }, { status: 400 });

    // Find student for name denormalization
    const student = await User.findById(studentId).lean();
    if (!student) return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });

    // Check for existing record
    const existing = await FeeRecord.findOne({ studentId });
    if (existing) return NextResponse.json({ success: false, message: 'A fee record already exists for this student.' }, { status: 409 });

    let calc;
    try {
        calc = calcFees({ basePrice: Number(baseCoursePrice), discountPercent: Number(discountPercent ?? 0), flatDiscount: Number(flatDiscount ?? 0) });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, message: e instanceof Error ? e.message : 'Invalid discount.' }, { status: 400 });
    }

    const record = await FeeRecord.create({
        ...calc,
        studentId,
        studentName: student.fullName,
        course,
        remainingAmount: calc.finalFees,
        amountPaid: 0,
        globalOfferApplied,
        payments: [],
        createdBy: session.user.id,
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
}
