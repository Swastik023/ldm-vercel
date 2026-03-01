import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentFee } from '@/models/StudentFee';

// GET /api/student/fees — student sees only their own fee records
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const fees = await StudentFee.find({ studentId: session.user.id }).sort({ createdAt: -1 }).lean();

    // Map DB fields → frontend-expected field names
    const records = fees.map((f: any) => {
        const discountAmount = Math.round((f.baseFee * f.discountPct) / 100);
        const remaining = Math.max(0, f.finalFee - f.amountPaid);
        return {
            _id: f._id,
            course: f.feeLabel || f.courseId || 'Course Fee',
            academicYear: f.academicYear,
            baseCoursePrice: f.baseFee,
            discountPercent: f.discountPct,
            discountAmount,
            finalFees: f.finalFee,
            amountPaid: f.amountPaid,
            remainingAmount: remaining,
            globalOfferApplied: f.discountPct > 0 ? `${f.discountPct}% discount applied` : null,
            payments: (f.payments || []).map((p: any) => ({
                amount: p.amount,
                date: p.date,
                method: 'Payment',
                note: p.note || '',
            })),
            notes: f.notes,
        };
    });

    return NextResponse.json({
        success: true,
        fees: records,
        record: records[0] || null,
        message: records.length === 0 ? 'No fee records found for your account.' : undefined,
    });
}
